import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from '@/composables/useToast'
import { useAdviserStore } from '@/stores/adviser'
import { adviserApi } from '@/api/adviser.api'
import { memberApi } from '@/api/member.api'
import type { Submission } from '@/types/adviser'
import { unwrapData } from '@/utils/apiHelpers'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

interface RecommendationForm { org: string; type: string; linked: string; text: string }
interface GapForm { text: string }

export function useAdviserDetailController() {
  const route = useRoute()
  const router = useRouter()
  const adviserStore = useAdviserStore()
  const { toasts, push: pushToast } = useToast()

  const loading = ref(true)
  const delivering = ref(false)
  const exportingPdf = ref(false)
  const generatingAiDraft = ref(false)
  const fetchingOverlaps = ref(false)
  const parsingFile = ref(false)

  const submissionId = ref<number>(Number(route.params.id) || 0)
  const currentStatus = ref<string>(ADVISORY_NOTE_STATUS.SUBMITTED_FOR_REVIEW)
  const submission = ref<Submission | null>(null)
  const assigneeId = ref<number | null>(null)
  const overlapSearched = ref(false)
  const lastOverlapMatches = ref<any[]>([])

  const form = ref({
    sectionA: '',
    sectionB: [] as RecommendationForm[],
    sectionC: [] as GapForm[],
    sectionD: '',
  })

  // ── AI Draft Programme Modal ───────────────────────────────────────────────
  const showDraftModal = ref(false)
  const draftGenerating = ref(false)
  const draftOrganisations = ref<{ id: number; name: string }[]>([])
  const selectedOrgId = ref<number | null>(null)
  const programmeName = ref('')
  const startYear = ref<number>(new Date().getFullYear())

  async function openDraftModal() {
    showDraftModal.value = true
    if (!draftOrganisations.value.length) {
      try {
        const res = await memberApi.listAllOrganisations()
        const data = unwrapData(res.data)
        draftOrganisations.value = Array.isArray(data) ? data : data?.data ?? []
      } catch { pushToast('Failed to load organisations') }
    }
  }

  async function generateAndDraft() {
    if (!selectedOrgId.value) { pushToast('Please select an organisation'); return }
    if (!programmeName.value.trim()) { pushToast('Please enter a programme name'); return }
    draftGenerating.value = true
    try {
      const profile = await buildProgrammeProfileFromSubmission()
      const aiRes = await adviserApi.generateAdvisoryNote(submissionId.value, profile)
      const aiData = unwrapData(aiRes.data) || {}
      const payload = {
        organisation_id: selectedOrgId.value,
        programme_name: programmeName.value.trim(),
        start_year: startYear.value,
        activities: [],
        geography: profile.geography,
        keywords: aiData.executive_summary
          ? aiData.executive_summary.split(' ').slice(0, 3).map((w: string) => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean)
          : [],
      }
      const entryRes = await adviserApi.createProgrammeEntry(submissionId.value, payload)
      const newId = entryRes.data?.data?.id
      showDraftModal.value = false
      pushToast('AI programme draft created — redirecting to form')
      router.push(`/entries/new?id=${newId}&org_id=${selectedOrgId.value}`)
    } catch (err: any) {
      pushToast(err?.response?.data?.message ?? 'Failed to generate programme draft')
    } finally { draftGenerating.value = false }
  }

  const coordinators = computed(() =>
    Object.entries(adviserStore.coordinatorMap).map(([id, name]) => ({ id: Number(id), name }))
  )
  const isDelivered = computed(() => currentStatus.value === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED)
  const isDraftEntry = computed(() =>
    !!submission.value?.programme_entry && !Number(submission.value.programme_entry.is_submitted)
  )
  const scopeDisplay = computed(() => {
    if (!submission.value) return 'full map'
    const s = submission.value
    return s.analysis_scope_detail ? `${s.analysis_scope}: ${s.analysis_scope_detail}` : (s.analysis_scope ?? 'full map')
  })
  const hasOverlaps = computed(() => form.value.sectionB.length > 0)
  const overlapNoResults = computed(() => overlapSearched.value && form.value.sectionB.length === 0)
  const isProfileEmpty = computed(() => {
    const entry = submission.value?.programme_entry
    return !(entry?.activities?.length) && !(entry?.locations?.length)
  })
  const isSectionsComplete = computed(() => {
    if (!form.value.sectionA?.trim()) return false
    if (hasOverlaps.value) return form.value.sectionB.every(r => r.org?.trim() && r.text?.trim())
    return true
  })
  const incompleteSectionBCount = computed(() =>
    form.value.sectionB.filter(r => !r.org?.trim() || !r.text?.trim()).length
  )

  onMounted(async () => {
    adviserStore.loadCoordinators()
    if (!submissionId.value && route.params.entryId) {
      try {
        const res = await adviserApi.getByProgrammeEntry(Number(route.params.entryId))
        const note = unwrapData(res.data)
        if (note?.id) { submissionId.value = note.id; applySubmission(note) }
      } finally { loading.value = false }
      return
    }
    try {
      const res = await adviserApi.getById(submissionId.value)
      const data = unwrapData(res.data)
      if (data) { applySubmission(data); await autoParseDocumentIfNeeded() }
    } finally { loading.value = false }
  })

  function applySubmission(data: Submission) {
    submission.value = data
    currentStatus.value = data.status
    assigneeId.value = data.assign_to_staff_user_id ?? null
    form.value.sectionA = data.section_profile || ''
    if (data.section_gaps) form.value.sectionC = [{ text: data.section_gaps }]
    if (data.section_coordinators_notes) form.value.sectionD = data.section_coordinators_notes
    const recs = data.recommendations
    if (Array.isArray(recs) && recs.length > 0) {
      form.value.sectionB = recs.map((r: any) => ({
        org: r.organisation_name || '',
        type: r.type || 'Geographic overlap',
        linked: r.programme_name || (r.programme_entry_id ? `Entry #${r.programme_entry_id}` : '-'),
        text: r.rationale || r.relational || '',
      }))
    }
  }

  function buildProfileFromEntry(entry: any) {
    return {
      activities: {
        category_ids: uniqueNumbers((entry?.activities ?? []).map((a: any) => a.activityItem?.subcategory?.category_id)),
        subcategory_ids: uniqueNumbers((entry?.activities ?? []).map((a: any) => a.activityItem?.subcategory?.id)),
        item_ids: uniqueNumbers((entry?.activities ?? []).map((a: any) => a.activity_item_id ?? a.activityItem?.id)),
        education_level_ids: [] as number[],
        inclusion_groups: [] as string[],
      },
      geography: {
        province_ids: uniqueNumbers((entry?.locations ?? []).map((l: any) => l.province_id)),
        district_ids: uniqueNumbers((entry?.locations ?? []).map((l: any) => l.district_id)),
        commune_ids: uniqueNumbers((entry?.locations ?? []).map((l: any) => l.commune_id)),
      },
      audiences: { inclusion_types: [] as string[] },
    }
  }

  async function buildProgrammeProfileFromSubmission() {
    let entry = submission.value?.programme_entry
    const entryId = submission.value?.programme_entry_id
    if (entryId && (!entry?.activities?.length && !entry?.locations?.length)) {
      try {
        const res = await adviserApi.getProgrammeEntry(entryId)
        const fetched = unwrapData(res.data)
        if (fetched) { entry = fetched; if (submission.value) submission.value.programme_entry = fetched }
      } catch { /* use whatever we have */ }
    }
    return buildProfileFromEntry(entry)
  }

  async function generateAiAdvisoryDraft() {
    if (generatingAiDraft.value || fetchingOverlaps.value || isDelivered.value) return
    generatingAiDraft.value = true
    try {
      await fetchMapOverlaps()
      pushToast('AI Analysis complete — all four sections populated')
    } catch (err: any) {
      pushToast(err?.response?.data?.message ?? 'AI Analysis failed')
    } finally { generatingAiDraft.value = false }
  }

  function handleViewDocument() {
    const docUrl = (submission.value as { document_url?: string; document_path?: string })?.document_url || (submission.value as { document_url?: string; document_path?: string })?.document_path
    if (docUrl) window.open(docUrl, '_blank')
    else pushToast(`Document: ${submission.value?.document_name || 'Uploaded File'} (read for prototype review)`)
  }

  function goBack() { router.push('/adviser') }

  let _saveDraftPromise: Promise<void> | null = null
  async function saveDraft() {
    if (isDraftEntry.value) return
    if (_saveDraftPromise) return _saveDraftPromise
    _saveDraftPromise = (async () => {
      try { await saveSections(); pushToast('Draft saved') }
      catch { pushToast('Failed to save draft') }
      finally { _saveDraftPromise = null }
    })()
    return _saveDraftPromise
  }

  async function markDelivered() {
    if (isDraftEntry.value) {
      pushToast('This programme has not been submitted by the member organisation yet. Advisory notes can only be delivered on submitted programmes.')
      return
    }
    if (!form.value.sectionA?.trim()) {
      pushToast('Please complete Section A (Programme profile as interpreted) before marking advice as delivered.')
      return
    }
    if (form.value.sectionB.some(r => !r.org?.trim() || !r.text?.trim())) {
      pushToast('Please fill in the organisation name and description for all coordination recommendations (Section B).')
      return
    }
    if (delivering.value) return
    delivering.value = true
    try {
      await saveSections()
      const res = await adviserApi.markDelivered(submissionId.value)
      const data = unwrapData(res.data)
      const newStatus = data?.status ?? ADVISORY_NOTE_STATUS.ADVICE_DELIVERED
      currentStatus.value = newStatus
      if (submission.value) submission.value.delivered_at = data?.delivered_at ?? new Date().toISOString()
      const existing = adviserStore.submissions.find(s => s.id === submissionId.value)
      if (existing) existing.status = newStatus
      pushToast('Advisory note saved and marked as delivered')
      router.push(`/adviser?tab=${ADVISORY_NOTE_STATUS.ADVICE_DELIVERED}`)
    } catch { pushToast('Failed to save - please try again') }
    finally { delivering.value = false }
  }

  async function exportAdvisoryNotePdf() {
    if (exportingPdf.value) return
    exportingPdf.value = true
    const docName = (submission.value?.document_name || 'Advisory_Note').replace(/[^a-zA-Z0-9_-]/g, '_')
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;padding:40px;background:#fff;font-family:Arial,sans-serif;font-size:13px;color:#1e293b;line-height:1.6;'
    container.innerHTML = buildPdfHtml(form.value, submission.value, scopeDisplay.value)
    document.body.appendChild(container)
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let y = 0, remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
        remaining -= pageH
        if (remaining > 0) { pdf.addPage(); y += pageH }
      }
      pdf.save(`Advisory_Note_${docName}.pdf`)
    } finally { document.body.removeChild(container); exportingPdf.value = false }
  }

  async function assignCoordinator(userId: number | null) {
    assigneeId.value = userId
    try {
      await adviserApi.updateAssignee(submissionId.value, userId)
      const existing = adviserStore.submissions.find(s => s.id === submissionId.value)
      if (existing) existing.assign_to_staff_user_id = userId
    } catch { /* optimistic — retry by re-selecting */ }
  }

  async function fetchMapOverlaps() {
    if (fetchingOverlaps.value) return
    fetchingOverlaps.value = true
    try {
      // For non-member submissions send an empty profile — the backend will extract
      // the profile from the stored document_text automatically.
      // For member submissions send the full profile from the linked programme entry.
      const isNonMember = !submission.value?.programme_entry_id
      const profile = isNonMember ? emptyProfile() : await buildProgrammeProfileFromSubmission()

      const res = await adviserApi.generateAdvisoryNote(submissionId.value, profile)
      const aiData = unwrapData(res.data) || {}
      const matches: any[] = Array.isArray(aiData.map_overlap_entries) ? aiData.map_overlap_entries : []

      lastOverlapMatches.value = matches
      overlapSearched.value = true

      const aiSectionBIndex: Record<string, any> = {}
      if (Array.isArray(aiData.section_b)) {
        for (const item of aiData.section_b) {
          if (item.programme_name) aiSectionBIndex[item.programme_name] = item
        }
      }

      if (matches.length > 0) {
        form.value.sectionB = matches.map((m: any) => {
          const orgName = typeof m.organisation === 'string' ? m.organisation : (m.organisation?.name || 'Partner Organisation')
          const entryName = m.programme_name || `Entry #${m.id}`
          const locationNames = (m.locations || []).map((l: any) => l.province_name).filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          const activityNames = (m.activities || []).map((a: any) => a.name).filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          const aiMatch = aiSectionBIndex[entryName]
          return {
            org: orgName,
            type: aiMatch?.overlap_type || 'Geographic overlap',
            linked: entryName,
            text: aiMatch?.rationale || [
              locationNames.length ? `Locations: ${locationNames.join(', ')}` : null,
              activityNames.length ? `Activities: ${activityNames.join(', ')}` : null,
              `Coordinate with ${orgName} to avoid duplication.`,
            ].filter(Boolean).join(' '),
          }
        })
        pushToast(`Found ${matches.length} overlapping programme(s) on the map`)
      } else {
        form.value.sectionB = []
      }

      if (aiData.ai_failed) {
        pushToast('Map overlaps found but AI generation failed — please retry')
        return
      }

      if (aiData.section_a) form.value.sectionA = aiData.section_a
      if (aiData.section_c) form.value.sectionC = [{ text: aiData.section_c }]
      if (aiData.section_d) form.value.sectionD = aiData.section_d

      if (aiData.section_a || aiData.section_c || aiData.section_d) {
        await adviserApi.updateSections(submissionId.value, {
          section_profile: form.value.sectionA,
          section_gaps: form.value.sectionC.map((g: any) => g.text).filter(Boolean).join('\n'),
          section_coordinators_notes: form.value.sectionD,
        })
        if (submission.value) submission.value.section_coordinators_notes = form.value.sectionD
      }
    } finally { fetchingOverlaps.value = false }
  }

  function emptyProfile() {
    return {
      activities: { category_ids: [], subcategory_ids: [], item_ids: [], education_level_ids: [], inclusion_groups: [] },
      geography: { province_ids: [], district_ids: [], commune_ids: [] },
      audiences: { inclusion_types: [] },
    }
  }

  const showReupload = computed(() =>
    !submission.value?.programme_entry_id &&
    !adviserStore.getParsedText(submissionId.value)
  )

  async function handleReupload(file: File) {
    if (parsingFile.value) return
    parsingFile.value = true
    try {
      const res = await adviserApi.parsePdf(submissionId.value, file)
      const text = (res.data as { text?: string })?.text
      if (text) {
        adviserStore.storeParsedText(submissionId.value, text)
        pushToast('Document parsed — click AI Analysis to generate')
      } else {
        pushToast('Could not extract text from this file')
      }
    } catch (err: any) {
      pushToast(err?.response?.data?.message ?? 'Failed to parse document')
    } finally {
      parsingFile.value = false
    }
  }

  async function autoParseDocumentIfNeeded() {
    if (submission.value?.programme_entry_id) return
    if (adviserStore.getParsedText(submissionId.value)) return
    // Check if document_text already on the submission (returned from backend)
    const existingText = (submission.value as { document_text?: string })?.document_text
    if (existingText) {
      adviserStore.storeParsedText(submissionId.value, existingText)
      return
    }
    // Auto-parse from stored file — no user action needed
    try {
      const res = await adviserApi.parseDocument(submissionId.value)
      const text = (res.data as { text?: string })?.text
      if (text) adviserStore.storeParsedText(submissionId.value, text)
    } catch {
      // no stored file — showReupload will appear as fallback
    }
  }

  function addRecommendation() { form.value.sectionB.push({ org: '', type: 'Geographic overlap', linked: '-', text: '' }) }
  function removeRecommendation(idx: number) { form.value.sectionB.splice(idx, 1) }
  function addGap() { form.value.sectionC.push({ text: '' }) }
  function removeGap(idx: number) { form.value.sectionC.splice(idx, 1) }

  async function saveSections(options: { recommendationEntryIds?: boolean } = {}) {
    const useIds = options.recommendationEntryIds ?? true
    return adviserApi.updateSections(submissionId.value, {
      section_profile: form.value.sectionA,
      section_gaps: form.value.sectionC.map(g => g.text).filter(Boolean).join('\n'),
      section_coordinators_notes: form.value.sectionD,
      recommendations: form.value.sectionB.map(r => ({
        organisation_name: r.org,
        programme_name: r.linked !== '-' ? r.linked : null,
        type: r.type,
        relational: r.text,
        rationale: r.text,
        programme_entry_id: useIds ? linkedEntryId(r.linked) : null,
      })),
    })
  }

  return {
    assigneeId, coordinators, currentStatus, delivering, exportingPdf, fetchingOverlaps,
    form, generatingAiDraft, isDelivered, isDraftEntry, isSectionsComplete,
    incompleteSectionBCount, loading, scopeDisplay, submission, submissionId, toasts,
    showDraftModal, draftGenerating, draftOrganisations, selectedOrgId, programmeName, startYear,
    addGap, addRecommendation, assignCoordinator, exportAdvisoryNotePdf, isProfileEmpty,
    overlapNoResults, fetchMapOverlaps, generateAiAdvisoryDraft, generateAndDraft, goBack,
    handleViewDocument, markDelivered, openDraftModal,
    openFinalNoteFile: () => adviserApi.openFinalNoteFile(submissionId.value),
    parsingFile, showReupload, handleReupload,
    removeGap, removeRecommendation, saveDraft,
  }
}

function buildPdfHtml(form: { sectionA: string; sectionB: RecommendationForm[]; sectionC: GapForm[] }, submission: Submission | null, scope: string) {
  const title = submission?.document_name || 'Advisory Note'
  const party = submission?.submitting_party || 'Member Organisation'
  let html = ''
  if (form.sectionA?.trim()) {
    html += `<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">A - Programme profile as interpreted</div><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;white-space:pre-wrap">${escapeHtml(form.sectionA.trim())}</div></div>`
  }
  if (form.sectionB?.length) {
    const recs = form.sectionB.map((r, i) => `<div style="border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin-bottom:8px"><strong>${i + 1}. ${escapeHtml(r.org)}</strong> <span style="background:#e2e8f0;padding:1px 6px;border-radius:4px;font-size:11px">${escapeHtml(r.type)}</span><br/><em style="color:#64748b;font-size:11px">Linked: ${escapeHtml(r.linked)}</em><p style="margin:6px 0 0;font-size:12px">${escapeHtml(r.text)}</p></div>`).join('')
    html += `<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">B - Coordination recommendations</div>${recs}</div>`
  }
  const gaps = form.sectionC?.filter(g => g?.text?.trim())
  if (gaps?.length) {
    html += `<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">C - Gaps in the map</div><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">${gaps.map(g => `<p style="margin:2px 0">- ${escapeHtml(g.text.trim())}</p>`).join('')}</div></div>`
  }
  return `<h1 style="color:#0F5A4D;font-size:20px;margin:0 0 4px">Advisory Note</h1><div style="color:#64748b;font-size:12px;border-bottom:2px solid #0F5A4D;padding-bottom:8px;margin-bottom:20px"><strong>Source:</strong> ${escapeHtml(title)} &nbsp;|&nbsp; <strong>Submitted by:</strong> ${escapeHtml(party)} &nbsp;|&nbsp; <strong>Scope:</strong> ${escapeHtml(scope)}</div>${html || '<p style="color:#94a3b8;font-style:italic">No sections recorded.</p>'}`
}

function uniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.map(Number).filter(Number.isFinite))]
}
function linkedEntryId(linked: string) {
  if (!linked || linked === '-') return null
  return Number(linked.replace(/\D/g, '')) || null
}
function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
