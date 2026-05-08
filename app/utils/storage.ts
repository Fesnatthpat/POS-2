import { createClient } from '@supabase/supabase-js'

// Supabase Configuration is now handled via runtimeConfig in Nuxt
const getSupabase = () => {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )
}

/**
 * Compresses an image file using Canvas API
 * @param file The original File object
 * @param targetSizeKB The target size in KB
 * @param folder Folder name (products or slips)
 */
export const compressAndUpload = async (
  file: File, 
  type: 'products' | 'slips'
): Promise<string | null> => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  // Map types to actual bucket names
  const bucketName = type === 'slips' ? 'e-Slip' : type;
  
  console.log(`Starting upload to bucket: ${bucketName}`)

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured.')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Define limits based on requirements
  const limits = {
    products: { min: 100, max: 200, target: 150 },
    slips: { min: 300, max: 500, target: 400 }
  }
  
  const limit = limits[type]
  
  try {
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onerror = (err) => {
        console.error('FileReader error:', err)
        resolve(null)
      }
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onerror = (err) => {
          console.error('Image load error:', err)
          resolve(null)
        }
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            
            // Resize logic
            const MAX_WIDTH = type === 'products' ? 800 : 1200
            if (width > MAX_WIDTH) {
              height = (MAX_WIDTH / width) * height
              width = MAX_WIDTH
            }
            
            canvas.width = width
            canvas.height = height
            
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)
            
            let quality = 0.8
            let blob: Blob | null = null
            let sizeKB = 0
            
            do {
              blob = await new Promise(resolveBlob => 
                canvas.toBlob(b => resolveBlob(b), 'image/jpeg', quality)
              )
              if (!blob) break
              sizeKB = blob.size / 1024
              
              if (sizeKB > limit.max) quality -= 0.1
              else if (sizeKB < limit.min && quality < 0.95) quality += 0.05
              else break
            } while (quality > 0.1 && (sizeKB > limit.max || sizeKB < limit.min))

            if (!blob) {
              console.error('Failed to create blob')
              resolve(null)
              return
            }

            const fileExt = 'jpg'
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = fileName

            // Upload to Supabase Storage using the mapped bucket name
            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true
              })

            if (error) {
              console.error('Supabase Storage Upload Error:', error)
              resolve(null)
              return
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)

            console.log('Upload successful:', publicUrl)
            resolve(publicUrl)
          } catch (err) {
            console.error('Error during compression/upload:', err)
            resolve(null)
          }
        }
      }
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}
