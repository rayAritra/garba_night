export type DiscoverProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  year: string;
  department: string | null;
  bio: string;
  photos: string[];
  interests: string[];
};

export type MatchSummary = {
  match_id: string;
  other_profile_id: string;
  other_name: string;
  other_photo: string | null;
  matched_at: string;
  latest_message: string | null;
  latest_message_at: string | null;
  unread_count: number;
};

/** The signed-in student's own full profile (own-row RLS only). */
export type OwnProfile = {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  interestedIn: string[];
  year: string | null;
  department: string | null;
  bio: string | null;
  instagram: string | null;
  whatsapp: string | null;
  shareInstagram: boolean;
  shareWhatsapp: boolean;
  onboardingCompleted: boolean;
  isActive: boolean;
  photos: string[];
  interests: string[];
};

export type MatchContact = {
  profile_id: string;
  name: string;
  photo: string | null;
  instagram_username: string | null;
  whatsapp_number: string | null;
};

export type ChatMessage = {
  id: number;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

/** Someone who liked the viewer and is still waiting for an answer (`get_likes_received`). */
export type LikeReceived = DiscoverProfile & { liked_at: string };

/** The other person's full profile in an active match (`get_match_details`); socials only if shared. */
export type MatchDetails = Omit<DiscoverProfile, "id"> & { profile_id: string; instagram_username: string | null; whatsapp_number: string | null };
