const modelCache: Record<string, any> = {}

export async function getModel(
  key: string,
  loader: () => Promise<any>
) {

  if (!modelCache[key]) {
    modelCache[key] = await loader()
  }

  return modelCache[key]
}