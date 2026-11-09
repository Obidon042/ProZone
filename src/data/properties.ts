export type Property = {
  id: string;
  name: string;
  location: string;
  price: string;
  period: "month" | "total";
  bedrooms: number;
  bathrooms: number;
  area: number;
  category: "House" | "Apartment" | "Villa";
  image: string;
  description?: string;
  ownerListing?: boolean;
  ownerId?: string;
  listedBy?: string;
  agentId?: string;
  listingStatus?: "Active" | "Pending" | "Sold" | "Draft";
};

export const properties: Property[] = [
  {
    id: "palm-view",
    name: "Palm View Residence",
    location: "Lekki Phase 1, Lagos",
    price: "₦4,500,000",
    period: "month",
    bedrooms: 4,
    bathrooms: 3,
    area: 240,
    category: "House",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnpn48U-AA1FxxwTClogVuu2d6ueEjwvQbUa08fLGSPV2LIquWuTHluF8&s=10",
  },
  {
    id: "garden-estate",
    name: "The Garden Estate",
    location: "Banana Island, Lagos",
    price: "₦850,000,000",
    period: "total",
    bedrooms: 5,
    bathrooms: 4,
    area: 380,
    category: "House",
    listingStatus: "Active",
    image:
      "https://hips.hearstapps.com/hmg-prod/images/edc100123egan-002-6500742f5feb7.jpg",
  },
  {
    id: "cove-apartments",
    name: "Cove Apartments",
    location: "Victoria Island, Lagos",
    price: "₦3,200,000",
    period: "month",
    bedrooms: 3,
    bathrooms: 2,
    area: 165,
    category: "Apartment",
    image:
      "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
  },
  {
    id: "willow-house",
    name: "Willow House",
    location: "Ikoyi, Lagos",
    price: "₦720,000,000",
    period: "total",
    bedrooms: 4,
    bathrooms: 4,
    area: 310,
    category: "Villa",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYcIepnnXLWa3S3CNsOsU-fZiE7-D_ByOXhN190nn4-XkUYNz4Got609k&s=10",
  },
  {
    id: "dutch-colonial",
    name: "Dutch Colonial Retreat",
    location: "Ikeja GRA, Lagos",
    price: "₦6,000,000",
    period: "month",
    bedrooms: 4,
    bathrooms: 3,
    area: 275,
    category: "House",
    image:
      "https://hips.hearstapps.com/hmg-prod/images/dutch-colonial-house-style-66956274903da.jpg?crop=1.00xw:0.671xh;0,0.131xh&resize=1120:*",
  },
  {
    id: "sater-villa",
    name: "Sater Garden Villa",
    location: "Eko Atlantic, Lagos",
    price: "₦1,200,000,000",
    period: "total",
    bedrooms: 6,
    bathrooms: 5,
    area: 420,
    category: "Villa",
    listingStatus: "Active",
    image:
      "https://saterdesign.com/cdn/shop/files/9507-Main-Image_1600x.jpg?v=1745265933",
  },
  {
    id: "riverstone-residence",
    name: "Riverstone Residence",
    location: "Ikoyi, Lagos",
    price: "₦5,200,000",
    period: "month",
    bedrooms: 4,
    bathrooms: 3,
    area: 260,
    category: "House",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiSdA2NwcKtnOjmiEMfosv_P_Hy-waU5GWLCrnuOCuPKChAWXNIOKoGeY&s=10",
  },
  {
    id: "modern-courtyard",
    name: "Modern Courtyard House",
    location: "Lekki Phase 1, Lagos",
    price: "₦790,000,000",
    period: "total",
    bedrooms: 5,
    bathrooms: 4,
    area: 340,
    category: "Villa",
    image:
      "https://blenderartists.org/uploads/default/original/4X/2/f/c/2fc208bad06ff504cf51432acf75e463027945b8.jpeg",
  },
  {
    id: "terrace-gardens",
    name: "Terrace Gardens",
    location: "Victoria Island, Lagos",
    price: "₦4,800,000",
    period: "month",
    bedrooms: 4,
    bathrooms: 3,
    area: 225,
    category: "House",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7sDhaSQFdvO_aTrBY5hJh3BroA-5dCXKrPaSkXaiA23uSD8NAP8mkdQc&s=10",
  },
  {
    id: "willett-modern",
    name: "Willett Modern Villa",
    location: "Banana Island, Lagos",
    price: "₦1,050,000,000",
    period: "total",
    bedrooms: 5,
    bathrooms: 5,
    area: 390,
    category: "Villa",
    image:
      "https://www.baufritz.com/Marketing/01_Haeuser/Kundenh%C3%A4user/Modern-Design/Willett/Bilder/92019/image-thumb__92019__houseOverview/Willett_portfolio_teaser_4000x3000_ASA.42ae3d60.png",
  },
  {
    id: "lagoon-house",
    name: "Lagoon House",
    location: "Lekki, Lagos",
    price: "₦6,500,000",
    period: "month",
    bedrooms: 4,
    bathrooms: 4,
    area: 290,
    category: "House",
    image:
      "https://www.buildofy.com/blog/content/images/size/w2000/2022/06/_DSC9610-Edited_-min.jpg",
  },
  {
    id: "harbor-retreat",
    name: "Harbor Retreat",
    location: "Eko Atlantic, Lagos",
    price: "₦980,000,000",
    period: "total",
    bedrooms: 5,
    bathrooms: 5,
    area: 360,
    category: "Villa",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/689947055.jpg?k=6f507938eaddc08f227bf3a73d38bbecd97ec87ca76491eecb8d96689a0e9452&o=",
  },
  {
    id: "oakline-residence",
    name: "Oakline Residence",
    location: "Ikeja GRA, Lagos",
    price: "₦3,900,000",
    period: "month",
    bedrooms: 3,
    bathrooms: 3,
    area: 210,
    category: "Apartment",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxZSvWpe9Lhsqs7IpD-rIJfo0etUTkCJwksf0_gRAKTrTx8LBPftPzZPr2&s=10",
  },
  {
    id: "modern-hillside-home",
    name: "Modern Hillside Home",
    location: "Lekki Phase 1, Lagos",
    price: "₦560,000,000",
    period: "total",
    bedrooms: 4,
    bathrooms: 4,
    area: 320,
    category: "Villa",
    image: "https://cdn.mos.cms.futurecdn.net/PzXJoJ3bH3kGpfDTbAmx69.jpg",
  },
  {
    id: "lakeside-residence",
    name: "Lakeside Residence",
    location: "Ikoyi, Lagos",
    price: "₦4,100,000",
    period: "month",
    bedrooms: 3,
    bathrooms: 3,
    area: 205,
    category: "House",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt27H32Py4RQSCnMO52qteIUEAwKjydlQ-5giSAHwZ2yCWh5ZsuNJaFfc&s=10",
  },
  {
    id: "cedar-court",
    name: "Cedar Court",
    location: "Victoria Island, Lagos",
    price: "₦4,700,000",
    period: "month",
    bedrooms: 3,
    bathrooms: 3,
    area: 215,
    category: "Apartment",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScLd4hyY1TPttWIVGtqEn_hkE1dw21VelBYCqdyFwgKg&s=10",
  },
  {
    id: "maple-grove-home",
    name: "Maple Grove Home",
    location: "Ikeja GRA, Lagos",
    price: "₦680,000,000",
    period: "total",
    bedrooms: 4,
    bathrooms: 4,
    area: 305,
    category: "House",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTkkKs3q_GB8o-1PM09CW4RdmuE3D1ffszok4wJTqe3Q&s=10",
  },
];
