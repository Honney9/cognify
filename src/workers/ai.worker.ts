import { runModel, runModelStream } from "@/services/ai/modelRegistry"

self.onmessage = async (event: MessageEvent) => {

  const { type, prompt, files, stream } = event.data

  try {

    console.log("[AI Worker] Received request:", { 
      type, 
      prompt: prompt?.substring(0, 50), 
      filesCount: files?.length,
      files: files?.map((f: any) => ({ name: f.name, type: f.type })),
      stream 
    })

    const normalizedType = type?.toLowerCase() || "chat"

    let input: any = prompt

    // If a file is attached, convert it properly
    if (files && files.length > 0 && files[0]) {

      const file = files[0]

      console.log("[AI Worker] Processing file:", { name: file.name, type: file.type, size: file.size })

      if (file.type.startsWith("image/")) {

        console.log("[AI Worker] Detected image file")
        
        // Prevent sending images to chat/code models
        if (normalizedType === "chat" || normalizedType === "code") {
          throw new Error(
            "⚠️ This text model doesn't support image inputs. " +
            "Please select 'Photo' or 'Screenshot' type to analyze images with the vision model."
          )
        }
        
        console.log("[AI Worker] Processing as bitmap for vision model")
        const bitmap = await createImageBitmap(file)
        input = bitmap

      } else {

        console.log("[AI Worker] Detected text file, reading content")
        const fileContent = await file.text()
        
        // For code files, combine the prompt with the file content
        if (normalizedType === "code") {
          input = prompt ? `${prompt}\n\nFile content:\n${fileContent}` : fileContent
        } else {
          input = fileContent
        }

      }

    } else {
      console.log("[AI Worker] No files attached, using prompt directly:", input?.substring(0, 100))
    }

    // If streaming is requested and it's a chat/code type (and no image files), use streaming
    const hasImageFile = files && files.length > 0 && files[0] && files[0].type.startsWith("image/")
    
    console.log("[AI Worker] Streaming decision:", { 
      stream, 
      normalizedType, 
      hasImageFile,
      willStream: stream && (normalizedType === "chat" || normalizedType === "code") && !hasImageFile
    })

    if (stream && (normalizedType === "chat" || normalizedType === "code") && !hasImageFile) {
      console.log("[AI Worker] Starting streaming response...")
      
      for await (const chunk of runModelStream(normalizedType, input)) {
        self.postMessage({
          success: true,
          chunk,
          streaming: true
        })
      }
      
      console.log("[AI Worker] Streaming complete")
      
      // Send final message to indicate streaming is complete
      self.postMessage({
        success: true,
        streaming: false,
        complete: true
      })
    } else {
      console.log("[AI Worker] Using non-streaming response...")
      
      // Non-streaming response (for images and other models)
      const result = await runModel(normalizedType, input)

      self.postMessage({
        success: true,
        result
      })
    }

  } catch (error) {

    console.error("[AI Worker] Error:", error)

    const errorMessage = (error as Error).message
    
    // Transform technical image errors into user-friendly messages
    let userFriendlyError = errorMessage
    
    if (errorMessage.includes('image') && errorMessage.includes('does not support')) {
      userFriendlyError = "⚠️ This text model doesn't support image inputs. Please use the vision model for analyzing images, photos, or screenshots."
    } else if (errorMessage.includes('Cannot read') && errorMessage.includes('image')) {
      userFriendlyError = "⚠️ Unable to process image with this model. For image analysis, please ensure you're using the vision model (Photos or Screenshots)."
    }

    self.postMessage({
      success: false,
      error: userFriendlyError
    })

  }

}