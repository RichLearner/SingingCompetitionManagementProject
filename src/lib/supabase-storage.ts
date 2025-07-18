import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create storage buckets if they don't exist
export async function initializeStorageBuckets() {
  try {
    // Check if photos bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const photoBucketExists = buckets?.some(
      (bucket) => bucket.name === "photos"
    );

    if (!photoBucketExists) {
      // Create photos bucket
      const { error } = await supabase.storage.createBucket("photos", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error("Error creating photos bucket:", error);
      } else {
        console.log("Photos bucket created successfully");
      }
    }

    // Set up RLS policies for photos bucket
    await setupStoragePolicies();
  } catch (error) {
    console.error("Error initializing storage buckets:", error);
  }
}

async function setupStoragePolicies() {
  // These policies should be created in Supabase dashboard or via SQL
  // For now, we'll just log the required SQL
  const policies = `
    -- Allow public read access to photos
    CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

    -- Allow authenticated users to upload photos
    CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'photos' AND 
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = 'uploads'
    );

    -- Allow authenticated users to update their own photos
    CREATE POLICY "Authenticated Update" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'photos' AND 
      auth.role() = 'authenticated'
    );

    -- Allow authenticated users to delete their own photos
    CREATE POLICY "Authenticated Delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'photos' AND 
      auth.role() = 'authenticated'
    );
  `;

  console.log("Required storage policies:");
  console.log(policies);
}

export async function deleteFile(url: string) {
  try {
    // Extract file path from URL
    const urlParts = url.split("/storage/v1/object/public/photos/");
    if (urlParts.length < 2) {
      throw new Error("Invalid file URL");
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from("photos").remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

export async function getFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

export { supabase };
