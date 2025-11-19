import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadFoodImage(file: File) {
  const fileName = `${Date.now()}-${file.name}`;  

  const { error } = await supabase.storage
    .from("masakan-bandung")
    .upload(`uploads/${fileName}`, file, {
      upsert: false, // jangan overwrite file lama
    });

  if (error) throw error;

  // URL PUBLIC langsung
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/masakan-bandung/uploads/${fileName}`;

  return publicUrl;
}
