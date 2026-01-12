// Enhanced prompts for detailed specialist agent responses

export const DETAILED_STAY_PROMPT_ADDITION = `
DETAILED INFORMATION TO INCLUDE:
- Specific hotel names with addresses
- Full address including neighborhood
- Distance to major attractions with walk times
- Price per night with fees breakdown (resort fees, taxes, parking)
- Star rating and guest review scores
- Specific amenities list
- Room types and sizes
- Check-in/out times
- Parking details and costs
- Public transport access details

EXAMPLE DETAILED RECOMMENDATION:
{
  "name": "Hotel Zephyr Fisherman's Wharf",
  "address": "250 Beach Street, Fisherman's Wharf, San Francisco, CA 94133",
  "neighborhood": "Fisherman's Wharf - Tourist-friendly waterfront location",
  "rating": "4-star, 4.3/5 (1,250 reviews)",
  "estimatedCost": "$180-$250/night + $35 resort fee + 14% tax",
  "roomType": "Standard Queen: 300 sq ft, 1 Queen bed",
  "amenities": ["Free WiFi", "Fitness center", "Restaurant", "24-hour desk"],
  "distancesToAttractions": ["Pier 39: 0.3 mi (7 min walk)", "Cable car: 0.2 mi (4 min)"],
  "parking": "Valet $45/night",
  "checkInOut": "Check-in 4 PM, Check-out 11 AM"
}`;

export const DETAILED_FOOD_PROMPT_ADDITION = `
RESTAURANT DETAILS TO INCLUDE:
- Specific names with full addresses
- Cuisine type and specialty
- Price range per person for each meal type
- Hours of operation
- Rating and number of reviews
- Distance from hotel/attractions
- Reservation requirements
- Signature dishes (3-5 specific items)
- Ambiance description
- Dietary accommodation details
- Parking/transport access

ACTIVITY DETAILS TO INCLUDE:
- Specific attraction names and addresses
- Hours and best times to visit
- Admission prices (all age categories)
- Duration needed
- Distance and travel time
- Booking requirements
- What to bring/wear
- Accessibility information

EXAMPLE DETAILED RESTAURANT:
{
  "name": "Greens Restaurant",
  "address": "2 Marina Blvd, Building A, Fort Mason, SF, CA 94123",
  "cuisine": "Upscale vegetarian, California cuisine",
  "hours": "Lunch Tue-Sat 11:30 AM-2:30 PM, Dinner Tue-Sun 5:30-9 PM",
  "priceRange": "Lunch $18-$28, Dinner $35-$55",
  "rating": "4.5/5 (850 reviews), Michelin Bib Gourmand",
  "distanceFrom": "1.5 mi from Fisherman's Wharf (10 min drive)",
  "signatureDishes": ["Wild mushroom pizza", "Grilled vegetable plate"],
  "dietaryInfo": "100% vegetarian, extensive vegan menu, gluten-free available",
  "reservationTips": "Book 1-2 weeks ahead for dinner, walk-ins OK for weekday lunch"
}`;
