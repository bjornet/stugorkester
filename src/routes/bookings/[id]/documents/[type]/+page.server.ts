import { buildDocument } from '$lib/server/documents';
import { isDocumentType } from '$lib/documents';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!isDocumentType(params.type)) throw error(404, 'Unknown document type');

  const model = await buildDocument(params.id, params.type);
  if (!model) throw error(404, 'Booking not found');

  return { model, bookingId: params.id };
};
