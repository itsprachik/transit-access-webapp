import React from "react";
import { FaDiscord } from "react-icons/fa";
import { FaEnvelope, FaTiktok, FaInstagram, FaBluesky } from "react-icons/fa6";
import { RiSurveyLine } from "react-icons/ri";
import { SiBuymeacoffee } from "react-icons/si";
import styled from "styled-components";

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 45px;
  left: 6px;
  display: flex;
  gap: 0.3rem;
  z-index: 998;
  flex-direction: column;

  @media (max-width: 768px) {
    bottom: 45px;
    left: 6px;
    gap: 0.3rem;
  }
`;

const SocialLink = styled.a`
  color: #ffffff;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  width: 25px;
  height: 25px;
  font-size: 1rem;
  border-radius: 50%;
  backdrop-filter: blur(4px);

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
    transform: translateY(-2px);
  }

  &:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 25px;
    height: 25px;
    font-size: 1rem;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <SocialLink
        href="https://discord.gg/HgZVSJ9SE8"
        aria-label="Join our Discord!"
      >
        <FaDiscord />
      </SocialLink>
      <SocialLink
        href="mailto:team@transitaccess.org"
        aria-label="Send us an email"
      >
        <FaEnvelope />
      </SocialLink>

      <SocialLink
        href="https://www.buymeacoffee.com/transitaccess"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
      >
        <SiBuymeacoffee />
      </SocialLink>

      <SocialLink
        href="https://www.tiktok.com/@transitaccess"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit our TikTok page"
      >
        <FaTiktok />
      </SocialLink>

      <SocialLink
        href="https://www.instagram.com/transitaccess/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit our Instagram page"
      >
        <FaInstagram />
      </SocialLink>

      <SocialLink
        href="https://bsky.app/profile/transitaccess.bsky.social"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit our Bluesky page"
      >
        <FaBluesky />
      </SocialLink>

      <SocialLink
        href="https://app.youform.com/forms/dnefmhvd"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Take our feedback survey"
      >
        <RiSurveyLine />
      </SocialLink>
    </FooterContainer>
  );
};

export default Footer;
