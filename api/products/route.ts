import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateColorVariant, saveImageToFileSystem } from '@/lib/imageProcessingService';
import { productColors } from '@/components/ProductColorSelector';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get form data
    const formData = await req.formData();
    
    // Extract product data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const subcategory = formData.get('subcategory') as string;
    const price = parseFloat(formData.get('price') as string);
    const imageFile = formData.get('image') as File;
    const tagsJson = formData.get('tags') as string;
    const colorsJson = formData.get('colors') as string;
    
    // Parse JSON data
    const tags = JSON.parse(tagsJson || '[]');
    const colors = JSON.parse(colorsJson || '[]');
    
    // Validate required fields
    if (!name || !category || !price || !imageFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process the main product image
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const mainImagePath = await saveImageToFileSystem(
      imageBuffer,
      imageFile.name,
      'products'
    );
    
    // Generate and save color variants
    const colorVariants = [];
    
    for (const colorValue of colors) {
      try {
        // Get the hex code for the color
        let hexColor = '#CCCCCC'; // Default gray
        
        // Find the color in predefined colors
        const predefinedColor = productColors.find(c => c.value === colorValue);
        if (predefinedColor) {
          hexColor = predefinedColor.hex;
        } else if (colorValue.startsWith('#')) {
          // If the color value is already a hex code
          hexColor = colorValue;
        }
        
        // Generate the color variant
        const variantBuffer = await generateColorVariant(imageBuffer, {
          hexColor,
          preserveTransparency: true,
          blendMode: 'multiply'
        });
        
        // Save the variant image
        const variantImagePath = await saveImageToFileSystem(
          variantBuffer,
          `${imageFile.name.split('.')[0]}-${colorValue}`,
          'products/variants'
        );
        
        // Add to color variants array
        colorVariants.push({
          color: colorValue,
          hex: hexColor,
          image: variantImagePath
        });
      } catch (error) {
        console.error(`Error processing variant for color ${colorValue}:`, error);
        // Continue with other colors even if one fails
      }
    }
    
    // Create the product with color variants
    const product = {
      name,
      description,
      category,
      subcategory,
      price,
      image: mainImagePath,
      tags,
      colors,
      colorVariants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to database (implementation depends on your database setup)
    const savedProduct = await saveProductToDatabase(product);
    
    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Helper function to save product to database
async function saveProductToDatabase(product: any) {
  // Implementation depends on your database setup (MongoDB, Prisma, etc.)
  // This is a placeholder for the actual implementation
  
  // For MongoDB example:
  // const db = await connectToDatabase();
  // const collection = db.collection('products');
  // const result = await collection.insertOne(product);
  // return { ...product, _id: result.insertedId };
  
  // For now, return the product with a mock ID
  return { ...product, _id: `product_${Date.now()}` };
}