import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CheckMarkIcon } from '../../../../../assets/icons'
import { BasicButton } from '../../../../../components/buttons/BasicButton'
import { PrintTemplateService, type PrintLabelTemplate } from '../../../../settings/api/printTemplateService'
import type { OrderPayload } from '../../../types/backend'
import { formatTimeLabel, normalizeWeekKey } from '../../../utils/timeFormat'

interface PrintLabelButtonProps {
  orders: OrderPayload[]
}

const fillTemplate = (template: string, context: Record<string, unknown>): string => {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, rawPath) => {
    const path = String(rawPath).trim()
    if (path === 'week') {
      const deliveryDateRaw =
        context.delivery_date ??
        (context.item as Record<string, unknown> | undefined)?.delivery_date ??
        null
      const deliveryDate = typeof deliveryDateRaw === 'string' ? deliveryDateRaw : null
      const { weekNumber } = normalizeWeekKey(deliveryDate)
      return weekNumber != null ? String(weekNumber) : ''
    }
    const parts = path.split('.')
    let value: any = context
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        value = ''
        break
      }
    }
    return value == null ? '' : String(value)
  })
}

const buildLabels = (orders: OrderPayload[], template: PrintLabelTemplate): string => {
  const blocks: string[] = []
  const target = template.template_target
  if (target === 'items') {
    orders.forEach((order) => {
      const items = order.delivery_items ?? []
      items.forEach((item, idx) => {
        const itemWithDate = { ...item, delivery_date: order.delivery_date }
        const context: Record<string, unknown> = {
          ...order,
          item: itemWithDate,
          item_index: idx + 1,
          expected_arrival_time: formatTimeLabel(order.expected_arrival_time),
        }
        blocks.push(fillTemplate(template.template_string, context))
      })
    })
  } else {
    orders.forEach((order, idx) => {
      const context: Record<string, unknown> = {
        ...order,
        order_index: idx + 1,
        expected_arrival_time: formatTimeLabel(order.expected_arrival_time),
      }
      blocks.push(fillTemplate(template.template_string, context))
    })
  }
  return blocks
    .map((block, idx) => `<div class="print-label${idx === blocks.length - 1 ? ' last' : ''}">${block}</div>`)
    .join('')
}

const extractLabelDimensions = (templateString: string): { widthMm?: number; heightMm?: number } => {
  const widthMatch = templateString.match(/width\s*:\s*([\d.]+)\s*mm/i)
  const heightMatch = templateString.match(/height\s*:\s*([\d.]+)\s*mm/i)

  const widthMm = widthMatch ? Number.parseFloat(widthMatch[1]) : undefined
  const heightMm = heightMatch ? Number.parseFloat(heightMatch[1]) : undefined

  return {
    widthMm: Number.isFinite(widthMm) ? widthMm : undefined,
    heightMm: Number.isFinite(heightMm) ? heightMm : undefined,
  }
}

const downloadAsPrintDocument = (html: string, dimensions?: { widthMm?: number; heightMm?: number }) => {
  const hasSize = Boolean(dimensions?.widthMm && dimensions?.heightMm)
  const pageStyle = hasSize
    ? `
        @page { size: ${dimensions?.widthMm}mm ${dimensions?.heightMm}mm; margin: 0; }
        html, body {
          width: ${dimensions?.widthMm}mm;
          height: ${dimensions?.heightMm}mm;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .print-label {
          width: ${dimensions?.widthMm}mm;
          height: ${dimensions?.heightMm}mm;
          page-break-after: always;
          margin: 0;
        }
        .print-label.last { page-break-after: auto; }
      `
    : `
        body { font-family: Arial, sans-serif; padding: 24px; margin:0; }
        .print-label { page-break-after: always; margin-bottom: 24px; }
        .print-label.last { page-break-after: auto; }
      `

  const content = `
    <!doctype html>
    <html>
      <head>
        <title>Labels</title>
        <style>${pageStyle}</style>
      </head>
      <body>${html}</body>
    </html>`

  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = url

  const cleanup = () => {
    URL.revokeObjectURL(url)
    iframe.remove()
  }

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) {
      cleanup()
      return
    }
    frameWindow.focus()
    frameWindow.print()
    setTimeout(cleanup, 500)
  }

  document.body.appendChild(iframe)
}

interface TemplateDropdownProps {
  templates: PrintLabelTemplate[]
  selectedId: number | null
  onSelect: (id: number) => void
  isLoading: boolean
  onCreate: () => void
  onEdit: () => void
}

const TemplateDropdown = ({
  templates,
  selectedId,
  onSelect,
  isLoading,
  onCreate,
  onEdit,
}: TemplateDropdownProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  const selectedTemplate = templates.find((tpl) => tpl.id === selectedId)

  const label = isLoading
    ? 'Loading templates…'
    : selectedTemplate
      ? selectedTemplate.name ?? `Template #${selectedTemplate.id}`
      : 'Choose template'

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        className="w-full border border-gray-300 rounded px-3 py-2 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isLoading}
      >
        <span className="truncate">{label}</span>
        <span className="text-gray-500">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full border border-gray-200 bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto divide-y divide-gray-100">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedId
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onSelect(tpl.id)
                    setOpen(false)
                  }}
                  className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <div className="font-semibold text-sm text-[var(--color-text)]">
                      {tpl.name ?? `Template #${tpl.id}`}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Target: {tpl.template_target ?? 'order'}</div>
                  </div>
                  {isSelected ? (
                    <CheckMarkIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <span className="w-5 h-5" />
                  )}
                </button>
              )
            })}
            {!templates.length && (
              <div className="p-3 text-sm text-[var(--color-muted)]">No templates available</div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-200 bg-gray-50">
            <BasicButton
              params={{
                variant: 'secondary',
                className: 'flex-1',
                onClick: () => {
                  console.log('Create template')
                  onCreate()
                  setOpen(false)
                },
              }}
            >
              Create template
            </BasicButton>
            <BasicButton
              params={{
                variant: 'secondary',
                className: 'flex-1',
                onClick: () => {
                  console.log('Edit template')
                  onEdit()
                  setOpen(false)
                },
                disabled: !selectedTemplate,
              }}
            >
              Edit template
            </BasicButton>
          </div>
        </div>
      )}
    </div>
  )
}

export function PrintLabelButton({ orders }: PrintLabelButtonProps) {
  const [templates, setTemplates] = useState<PrintLabelTemplate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const service = useMemo(() => new PrintTemplateService(), [])

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedId) ?? null,
    [selectedId, templates],
  )

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await service.fetchTemplates()
      const items = response.data?.items ?? []
      setTemplates(items)
      if (!selectedId && items[0]) {
        setSelectedId(items[0].id)
      }
    } catch (error) {
      console.error('Failed to load print templates', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedId, service])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const handlePrint = useCallback(() => {
    if (!selectedTemplate) {
      return
    }
    const html = buildLabels(orders, selectedTemplate)
    if (html) {
      const dimensions = extractLabelDimensions(selectedTemplate.template_string ?? '')
      downloadAsPrintDocument(html, dimensions)

    }
  }, [orders, selectedTemplate])

  return (
    <div className="space-y-2 flex-1 flex flex-col">
      <div className="flex gap-2 items-center">
        <BasicButton
          params={{
            variant: 'secondary',
            className: 'whitespace-nowrap',
            onClick: selectedTemplate ? handlePrint : () => setSelectedId(null),
            disabled: isLoading || !orders.length,
          }}
        >
          {selectedTemplate ? 'Print Labels' : 'Select Template'}
        </BasicButton>
        <div className="flex-1 min-w-[220px]">
          <TemplateDropdown
            templates={templates}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            isLoading={isLoading}
            onCreate={() => console.log('Create template')}
            onEdit={() => console.log('Edit template')}
          />
        </div>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Current template: {selectedTemplate ? selectedTemplate.name ?? `Template #${selectedTemplate.id}` : 'None selected'}
      </p>
    </div>
  )
}
