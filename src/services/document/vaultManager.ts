import { saveFileOffline } from "@/services/db"

export async function saveSensitiveFile(file: File) {

  try {

    await saveFileOffline(file, "Secure Vault")

    console.log("File saved to Secure Vault")

  } catch (error) {

    console.error("Failed to save to Secure Vault:", error)

  }

}