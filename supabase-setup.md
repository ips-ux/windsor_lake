# Supabase Setup Guide

## Current Status
✅ Table `carousel_images` created with correct structure

## Option 1: Use Local Images (Current Setup)
The carousel is currently configured to use local images as fallback. These images work right now:
- `assets/images/carousel/coffe_in_mug.jpg`
- `assets/images/carousel/blueberry_cupcakes.jpg`
- `assets/images/carousel/tomato_egg_grilled_cheese_black_coffee.jpg`

## Option 2: Upload Images to Supabase Storage

### Step 1: Create Storage Bucket
1. Go to Supabase Dashboard > Storage
2. Create a new bucket called `carousel`
3. Make it **public** (so images can be accessed via URL)

### Step 2: Upload Your Images
1. Upload the 3 images from `assets/images/carousel/`
2. Copy the public URLs for each image

### Step 3: Insert Records into Database
Go to SQL Editor and run:

```sql
-- Insert carousel images (replace URLs with your actual Supabase Storage URLs)
INSERT INTO carousel_images (image_url, active, order_position) VALUES
  ('https://oumpmbgbtziklwiqjrhm.supabase.co/storage/v1/object/public/carousel/coffe_in_mug.jpg', true, 1),
  ('https://oumpmbgbtziklwiqjrhm.supabase.co/storage/v1/object/public/carousel/blueberry_cupcakes.jpg', true, 2),
  ('https://oumpmbgbtziklwiqjrhm.supabase.co/storage/v1/object/public/carousel/tomato_egg_grilled_cheese_black_coffee.jpg', true, 3);
```

### Step 4: Enable Row Level Security (Optional but Recommended)
```sql
-- Allow public reads
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON carousel_images
  FOR SELECT
  USING (active = true);

-- For admin updates (you'll need authentication set up)
-- CREATE POLICY "Allow authenticated updates" ON carousel_images
--   FOR ALL
--   USING (auth.role() = 'authenticated');
```

## Testing
Once you insert records, the carousel will automatically switch from local images to Supabase images on next page load.

## Managing Images
To add/remove/reorder images:
1. Go to Supabase Dashboard > Table Editor > carousel_images
2. Click "Insert" to add new images
3. Set `active = false` to hide images without deleting
4. Change `order_position` to reorder images
