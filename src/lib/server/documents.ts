import { db } from './db';
import { booking } from './db/schema';
import { documentTitles, type DocumentType } from '$lib/documents';
import { bookingIncome } from '$lib/economy';
import { money } from '$lib/format';
import { eq } from 'drizzle-orm';

export interface DocSection {
  heading: string;
  /** Paragraphs of body text. */
  body: string[];
}

export interface DocumentModel {
  type: DocumentType;
  title: string;
  propertyName: string;
  channelName: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  sections: DocSection[];
}

const CLEANING_INCLUDED = 'Final cleaning is included in the price.';

/**
 * Assemble a document model for a booking. Returns null if the booking is
 * missing. Content uses the data we hold (dates, prices, house rules,
 * cancellation policy); anything not modelled yet is left as clear standard
 * wording for the host to adjust before sending.
 */
export async function buildDocument(
  bookingId: string,
  type: DocumentType
): Promise<DocumentModel | null> {
  const found = await db.query.booking.findFirst({
    where: eq(booking.id, bookingId),
    with: {
      property: { columns: { name: true, description: true, houseRules: true } },
      channel: { columns: { name: true } },
      guest: { columns: { name: true } }
    }
  });
  if (!found) return null;

  const guestName = found.guest?.name ?? null;
  const houseRules = found.property.houseRules ?? 'See the listing for the full house rules.';
  const total = money(bookingIncome(found));

  const base: Omit<DocumentModel, 'sections'> = {
    type,
    title: documentTitles[type],
    propertyName: found.property.name,
    channelName: found.channel.name,
    guestName,
    checkIn: found.checkIn,
    checkOut: found.checkOut
  };

  const priceLines = [
    `Base price: ${money(found.basePrice)}`,
    `Cleaning fee: ${money(found.cleaningFee)}`,
    `Total: ${total}`
  ];

  const sections = ((): DocSection[] => {
    switch (type) {
      case 'terms_addendum':
        return [
          {
            heading: 'Purpose',
            body: [
              `This addendum complements the booking made via ${found.channel.name} and covers terms not included in the channel's booking offer.`
            ]
          },
          { heading: 'House rules', body: [houseRules] },
          {
            heading: 'Cleaning',
            body: [
              CLEANING_INCLUDED,
              'Please leave the cabin tidy; a departure checklist is provided on site.'
            ]
          },
          {
            heading: 'Occupancy, pets and smoking',
            body: [
              'The cabin is let to the number of guests stated in the booking. Pets and smoking indoors are not permitted unless agreed in writing.'
            ]
          },
          {
            heading: 'Damage liability',
            body: [
              'The guest is liable for damage beyond normal wear during the stay. Report any damage as soon as possible.'
            ]
          }
        ];
      case 'rental_agreement':
        return [
          {
            heading: 'Parties',
            body: [`Landlord: the property owner.`, `Guest: ${guestName ?? '_______________'}.`]
          },
          {
            heading: 'Property',
            body: [found.property.name, found.property.description ?? ''].filter(Boolean)
          },
          {
            heading: 'Rental period',
            body: [`Check-in ${found.checkIn}, check-out ${found.checkOut}.`]
          },
          { heading: 'Price', body: priceLines },
          {
            heading: 'Payment',
            body: [
              'Payment is made directly to the landlord per the agreed schedule. A receipt is issued for each payment.'
            ]
          },
          {
            heading: 'Cancellation',
            body: [found.cancellationPolicy ?? 'Cancellation terms as agreed between the parties.']
          },
          { heading: 'House rules', body: [houseRules, CLEANING_INCLUDED] },
          {
            heading: 'Signatures',
            body: ['Landlord: ______________________', 'Guest: ______________________']
          }
        ];
      case 'booking_confirmation':
        return [
          {
            heading: 'Confirmation',
            body: [
              `We confirm the booking of ${found.property.name} for ${guestName ?? 'the guest'}.`,
              `Check-in ${found.checkIn}, check-out ${found.checkOut}.`
            ]
          },
          { heading: 'Price', body: priceLines },
          { heading: 'Included', body: [CLEANING_INCLUDED] }
        ];
      case 'receipt':
        return [
          {
            heading: 'Payment receipt',
            body: [
              `Received from ${guestName ?? 'the guest'} for the stay at ${found.property.name}.`,
              `Rental period: ${found.checkIn} – ${found.checkOut}.`,
              `Amount: ${total}.`
            ]
          }
        ];
      case 'checkin_info':
        return [
          {
            heading: 'Arrival',
            body: [
              `Check-in from 15:00 on ${found.checkIn}. Key collection and access details are sent before arrival.`
            ]
          },
          {
            heading: 'During your stay',
            body: [houseRules]
          },
          {
            heading: 'Departure',
            body: [
              `Check-out by 11:00 on ${found.checkOut}.`,
              CLEANING_INCLUDED,
              'Please wash up, take out rubbish, and leave furniture as found.'
            ]
          }
        ];
    }
  })();

  return { ...base, sections };
}
