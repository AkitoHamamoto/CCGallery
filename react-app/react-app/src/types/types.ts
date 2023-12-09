
export interface ProfileData {
  profile_image: string;
  full_name: string;
  username: string;
  contact_email: string;
  bio: string;
  github_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
}

export interface Portfolio {
  portfolio_uuid: string;
  title: string;
  subtitle: string;
  image: string;
  content: string;
  status: string;
  tags: string[];
  updated_at: string;
}