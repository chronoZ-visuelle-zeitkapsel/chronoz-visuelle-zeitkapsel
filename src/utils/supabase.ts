import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kiwfabsenxerpmgcgkxw.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpd2ZhYnNlbnhlcnBtZ2Nna3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTgwNTgsImV4cCI6MjA3ODA5NDA1OH0.L6R3ZDQLdZzOYDdFkzbbY--Lf5hZtG68fWnhGWdLUVc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImage(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('postcard-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Hole die öffentliche URL
    const { data: { publicUrl } } = supabase.storage
      .from('postcard-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extrahiere den Dateinamen aus der URL
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // userId/filename

    const { error } = await supabase.storage
      .from('postcard-images')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
