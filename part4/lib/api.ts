import { jwtDecode } from "jwt-decode";

import { authHeaders, getToken } from "@/lib/auth";

export type Review = {
  id: string;
  author: string;
  firstName?: string;
  lastName?: string;
  rating: number;
  comment: string;
  date: string;
};

export type Place = {
  id: string;
  ownerId?: string;
  name: string;
  country: string;
  city: string;
  category: string;
  price: number;
  description: string;
  amenities: string[];
  amenityIds?: string[];
  image: string;
  gallery: string[];
  rating: number;
  reviews: Review[];
  latitude?: number;
  longitude?: number;
  location?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type PlacePayload = {
  title: string;
  description: string;
  price: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  imageUrls?: string[];
  location: string;
  amenityIds?: string[];
};

export type UserProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
};

export type Amenity = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AmenityPayload = {
  name: string;
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export type AdminUserUpdatePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
};

export type AdminReview = {
  id: string;
  text: string;
  rating: number;
  userId: string;
  placeId: string;
};

export type ReviewPayload = {
  rating: number;
  comment: string;
};

export type LoginResponse = {
  token: string;
  user: {
    email: string;
  };
};

type BackendPlaceListItem = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  location?: string;
  owner_id?: string;
  amenities?: string[];
};

type BackendPlaceDetails = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  location?: string;
  owner_id?: string;
  amenities?: Array<{ id: string; name: string }>;
};

type BackendReview = {
  id: string;
  text?: string;
  comment?: string;
  rating?: number;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  updated_at?: string;
};

type BackendAmenity = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

type BackendUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_admin?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

function getPlaceImage(seed: string, variant = 1) {
  return `https://picsum.photos/seed/hbnb-${seed}-${variant}/1200/800`;
}

const MULTI_IMAGE_PREFIX = "json:";

function decodeImageUrls(imageUrl: string | undefined, placeId: string) {
  const fallback = getPlaceImage(placeId, 1);

  if (!imageUrl) {
    return [fallback];
  }

  const raw = imageUrl.trim();

  if (!raw) {
    return [fallback];
  }

  const parseJsonArray = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      return null;
    }
    return null;
  };

  if (raw.startsWith(MULTI_IMAGE_PREFIX)) {
    const parsed = parseJsonArray(raw.slice(MULTI_IMAGE_PREFIX.length));
    if (parsed && parsed.length > 0) {
      return parsed;
    }
  }

  if (raw.startsWith("[")) {
    const parsed = parseJsonArray(raw);
    if (parsed && parsed.length > 0) {
      return parsed;
    }
  }

  return [raw];
}

function encodeImageUrls(imageUrls?: string[], imageUrl?: string) {
  const normalized = (imageUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return (imageUrl ?? "").trim();
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return `${MULTI_IMAGE_PREFIX}${JSON.stringify(normalized)}`;
}

function formatCoordinates(
  latitude?: number,
  longitude?: number,
  city?: string,
  country?: string,
  location?: string
) {
  // Use actual city/country if provided by backend
  if (city || country) {
    return {
      city: city || "Lieu",
      country: country || "Global",
    };
  }

  // If location is a free-form string like "Paris, France", derive city/country from it.
  if (location) {
    const [locationCity, locationCountry] = location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      city: locationCity || "Lieu",
      country: locationCountry || "Global",
    };
  }

  // Fallback: format coordinates as location names if city/country not available
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      city: "Lieu",
      country: "Global",
    };
  }

  return {
    city: `Lat ${latitude.toFixed(2)}`,
    country: `Long ${longitude.toFixed(2)}`,
  };
}

function mapReview(review: BackendReview): Review {
  const firstName = review.first_name || "";
  const lastName = review.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Voyageur";

  return {
    id: review.id,
    author: fullName,
    firstName: firstName,
    lastName: lastName,
    rating: review.rating ?? 0,
    comment: review.text ?? review.comment ?? "",
    date: (review.updated_at ?? review.created_at ?? new Date().toISOString()).slice(0, 10),
  };
}

async function enrichReviewsWithUsers(reviews: BackendReview[], token?: string) {
  const userIds = Array.from(new Set(reviews.map((review) => review.user_id).filter(Boolean))) as string[];

  if (userIds.length === 0) {
    return reviews;
  }

  const userEntries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const user = await requestJson<BackendUser>(
          `/users/${userId}`,
          token ? { headers: authHeaders(token) } : undefined
        );
        return [userId, user] as const;
      } catch {
        return [userId, null] as const;
      }
    })
  );

  const usersById = new Map(userEntries);

  return reviews.map((review) => {
    if (!review.user_id) {
      return review;
    }

    const user = usersById.get(review.user_id);

    return {
      ...review,
      first_name: review.first_name ?? user?.first_name,
      last_name: review.last_name ?? user?.last_name,
    };
  });
}

function mapPlaceFromList(place: BackendPlaceListItem, amenitiesById?: Map<string, string>): Place {
  const coords = formatCoordinates(place.latitude, place.longitude, place.city, place.country, place.location);
  const amenityIds = (place.amenities ?? []).filter((amenity): amenity is string => typeof amenity === "string");
  const amenityNames = amenityIds.map((amenityId) => amenitiesById?.get(amenityId) ?? amenityId);
  const gallery = decodeImageUrls(place.image_url, place.id);
  const image = gallery[0] || getPlaceImage(place.id, 1);

  return {
    id: place.id,
    ownerId: place.owner_id,
    name: place.title,
    country: coords.country,
    city: coords.city,
    category: "Place",
    price: place.price ?? 0,
    description: place.description ?? "Aucune description fournie.",
    amenities: amenityNames.slice(0, 4),
    amenityIds,
    image,
    gallery,
    rating: 0,
    reviews: [],
    latitude: place.latitude,
    longitude: place.longitude,
    location: place.location ?? `${coords.city}, ${coords.country}`,
  };
}

function mapPlaceFromDetails(place: BackendPlaceDetails, reviews: BackendReview[]): Place {
  const coords = formatCoordinates(place.latitude, place.longitude, place.city, place.country, place.location);
  const mappedReviews = reviews.map(mapReview);
  const averageRating = mappedReviews.length
    ? Number((mappedReviews.reduce((sum, review) => sum + review.rating, 0) / mappedReviews.length).toFixed(2))
    : 0;
  const amenityIds = (place.amenities ?? []).map((amenity) => amenity.id);
  const amenityNames = (place.amenities ?? []).map((amenity) => amenity.name);
  const gallery = decodeImageUrls(place.image_url, place.id);
  const image = gallery[0] || getPlaceImage(place.id, 1);

  return {
    id: place.id,
    ownerId: place.owner_id,
    name: place.title,
    country: coords.country,
    city: coords.city,
    category: "Place",
    price: place.price ?? 0,
    description: place.description ?? "Aucune description fournie.",
    amenities: amenityNames,
    amenityIds,
    image,
    gallery,
    rating: averageRating,
    reviews: mappedReviews,
    latitude: place.latitude,
    longitude: place.longitude,
    location: place.location ?? `${coords.city}, ${coords.country}`,
  };
}

function requireUserIdFromToken(token: string) {
  const decoded = jwtDecode<{ sub?: string; identity?: string }>(token);
  const userId = decoded.sub ?? decoded.identity;

  if (!userId) {
    throw new Error("Impossible de determiner l'utilisateur depuis le token.");
  }

  return userId;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Request failed with status ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await requestJson<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    token: data.access_token,
    user: {
      email: payload.email,
    },
  };
}

export async function register(payload: RegisterPayload) {
  return requestJson<{ id: string; first_name: string; last_name: string; email: string }>("/users/", {
    method: "POST",
    body: JSON.stringify({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const userId = requireUserIdFromToken(token);
    const data = await requestJson<{ first_name?: string; last_name?: string; email?: string; is_admin?: boolean; id?: string }>(`/users/${userId}`, {
      headers: authHeaders(token),
    });

    return {
      id: data.id || userId,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      isAdmin: Boolean(data.is_admin),
    };
  } catch {
    return null;
  }
}

export async function updateCurrentUser(payload: UserProfilePayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour modifier votre profil.");
  }

  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Impossible de retrouver votre profil.");
  }

  const body: Record<string, string> = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
  };

  if (payload.password) {
    body.password = payload.password;
  }

  return requestJson<{ id: string; first_name?: string; last_name?: string; email?: string; is_admin?: boolean }>(`/users/${user.id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function getPlaces(country?: string): Promise<Place[]> {
  const token = getToken();
  const [data, amenities] = await Promise.all([
    requestJson<BackendPlaceListItem[]>("/places/", token ? { headers: authHeaders(token) } : {}),
    getAmenities().catch(() => []),
  ]);
  const amenitiesById = new Map(amenities.map((amenity) => [amenity.id, amenity.name] as const));
  const places = data.map((place) => mapPlaceFromList(place, amenitiesById));
  return country && country !== "all" ? places.filter((place) => place.country === country) : places;
}

export async function getPlace(id: string): Promise<Place | null> {
  try {
    const token = getToken();
    const [place, reviews] = await Promise.all([
      requestJson<BackendPlaceDetails>(`/places/${id}`, token ? { headers: authHeaders(token) } : {}),
      requestJson<BackendReview[]>(`/places/${id}/reviews`, token ? { headers: authHeaders(token) } : {}),
    ]);

    const reviewsWithUsers = await enrichReviewsWithUsers(reviews, token);

    return mapPlaceFromDetails(place, reviewsWithUsers);
  } catch {
    return null;
  }
}

export function getCountries(places: Place[]) {
  return Array.from(new Set(places.map((place) => place.country))).sort((a, b) => a.localeCompare(b));
}

export async function createReview(placeId: string, payload: ReviewPayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour publier un avis.");
  }

  const userId = requireUserIdFromToken(token);

  const created = await requestJson<BackendReview>("/reviews/", {
    method: "POST",
    headers: {
      ...authHeaders(token),
    },
    body: JSON.stringify({
      text: payload.comment,
      rating: payload.rating,
      place_id: placeId,
      user_id: userId,
    }),
  });

  let user: BackendUser | null = null;

  try {
    user = await requestJson<BackendUser>(`/users/${userId}`, {
      headers: authHeaders(token),
    });
  } catch {
    user = null;
  }

  return mapReview({
    ...created,
    first_name: created.first_name ?? user?.first_name,
    last_name: created.last_name ?? user?.last_name,
  });
}

export async function createPlace(payload: PlacePayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour creer un lieu.");
  }

  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Impossible de retrouver votre compte.");
  }

  return requestJson<BackendPlaceDetails>("/places/", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      price: Number(payload.price),
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      image_url: encodeImageUrls(payload.imageUrls, payload.imageUrl),
      location: payload.location,
      amenities: payload.amenityIds ?? [],
      owner_id: user.id,
    }),
  });
}

export async function updatePlace(placeId: string, payload: PlacePayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour modifier un lieu.");
  }

  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Impossible de retrouver votre compte.");
  }

  const body = JSON.stringify({
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    image_url: encodeImageUrls(payload.imageUrls, payload.imageUrl),
    location: payload.location,
    amenities: payload.amenityIds ?? [],
    owner_id: user.id,
  });

  try {
    return await requestJson<BackendPlaceDetails>(`/places/${placeId}`, {
      method: "PUT",
      headers: authHeaders(token),
      body,
    });
  } catch (error) {
    const apiError = error as Error & { status?: number };
    if (apiError.status !== 405) {
      throw error;
    }

    return requestJson<BackendPlaceDetails>(`/places/${placeId}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body,
    });
  }
}

export async function getUsersAdmin(): Promise<AdminUser[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour acceder a l'administration.");
  }

  const data = await requestJson<BackendUser[]>("/users/", {
    headers: authHeaders(token),
  });

  return data.map((user) => ({
    id: user.id || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    isAdmin: Boolean(user.is_admin),
  }));
}

export async function updateUserAdmin(userId: string, payload: AdminUserUpdatePayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour modifier un utilisateur.");
  }

  return requestJson<BackendUser>(`/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      ...(payload.firstName !== undefined ? { first_name: payload.firstName } : {}),
      ...(payload.lastName !== undefined ? { last_name: payload.lastName } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.password !== undefined ? { password: payload.password } : {}),
      ...(payload.isAdmin !== undefined ? { is_admin: payload.isAdmin } : {}),
    }),
  });
}

export async function deleteUserAdmin(userId: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour supprimer un utilisateur.");
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Suppression impossible (${response.status})`);
  }
}

export async function getReviewsAdmin(): Promise<AdminReview[]> {
  const token = getToken();
  const data = await requestJson<Array<{ id: string; text?: string; rating?: number; user_id?: string; place_id?: string }>>(
    "/reviews/",
    token ? { headers: authHeaders(token) } : {}
  );

  return data.map((review) => ({
    id: review.id,
    text: review.text || "",
    rating: review.rating ?? 0,
    userId: review.user_id || "",
    placeId: review.place_id || "",
  }));
}

export async function deleteReviewAdmin(reviewId: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour supprimer un avis.");
  }

  return requestJson<{ message?: string }>(`/reviews/${reviewId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function deletePlaceAdmin(placeId: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour supprimer un lieu.");
  }

  return requestJson<{ message?: string }>(`/places/${placeId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getAmenities(): Promise<Amenity[]> {
  const token = getToken();
  const data = await requestJson<BackendAmenity[]>("/amenities/", token ? { headers: authHeaders(token) } : {});

  return data.map((amenity) => ({
    id: amenity.id,
    name: amenity.name,
    createdAt: amenity.created_at,
    updatedAt: amenity.updated_at,
  }));
}

export async function createAmenity(payload: AmenityPayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour creer un amenity.");
  }

  return requestJson<BackendAmenity>("/amenities/", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      name: payload.name,
    }),
  });
}

export async function updateAmenity(amenityId: string, payload: AmenityPayload) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour modifier un amenity.");
  }

  return requestJson<BackendAmenity>(`/amenities/${amenityId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      name: payload.name,
    }),
  });
}

export async function deleteAmenity(amenityId: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Vous devez etre connecte pour supprimer un amenity.");
  }

  return requestJson<{ message?: string }>(`/amenities/${amenityId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
