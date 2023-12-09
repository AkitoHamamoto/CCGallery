// SnsIcon.tsx

import React from 'react';
import { FaTwitter, FaGithub, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { IconType } from 'react-icons'; // IconTypeをインポート

// 利用可能なSNSアイコンの型を定義
type SnsName = 'github' | 'twitter' | 'instagram' | 'youtube' | 'tiktok';

// SnsIconPropsの型を定義
interface SnsIconProps {
  snsName: SnsName;
  url?: string;
}

const SnsIcons: { [key in SnsName]: IconType } = {
  github: FaGithub,
  twitter: FaTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
};

const SnsIcon: React.FC<SnsIconProps> = ({ snsName, url }) => {
  const IconComponent = SnsIcons[snsName];

  if (!url) {
    return null;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mr-2">
      <IconComponent size={20} className="text-gray-500" />
    </a>
  );
};

export default SnsIcon;
