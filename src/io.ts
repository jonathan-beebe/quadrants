export function downloadJson(filename: string, data: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => resolve(ev.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}
