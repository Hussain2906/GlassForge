import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a unique slug for an organization
 * @param name - The organization name to convert to slug
 * @returns A unique slug that doesn't exist in the database
 */
export async function generateUniqueOrgSlug(name: string): Promise<string> {
  // Create base slug: lowercase, replace non-alphanumeric with hyphens, remove leading/trailing hyphens
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists and make it unique by appending a counter
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}