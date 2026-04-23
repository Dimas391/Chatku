import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';
import AppLogo from '@/app/src/Components/about/AppLogo';
import DescriptionBox from '@/app/src/Components/about/DescriptionBox';
import AboutSection from '@/app/src/Components/about/AboutSection';
import InfoRow from '@/app/src/Components/about/InfoRow';
import DeveloperCard from '@/app/src/Components/about/DeveloperCard';
import TechStack from '@/app/src/Components/about/TechStack';
import LinkItem from '@/app/src/Components/about/LinkItem';
import AboutFooter from '@/app/src/Components/about/AboutFooter';

const AboutScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const appInfo = [
    { label: t('app_name'), value: 'ChatKu' },
    { label: t('version'), value: '1.0.0' },
    { label: t('build'), value: '100' },
    { label: t('built_with'), value: 'React Native & FastAPI' },
    { label: t('release_date'), value: '1 April 2026' },
    { label: t('license'), value: 'MIT License' },
  ];
              
  const developers = [
    {
      name: 'Dimas',
      role: t('lead_developer'),
      github: 'dimasdev',
    },
    {
      name: 'Tim ChatKu',
      role: t('contributors'),
      github: 'chatku',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AppLogo appName="ChatKu" version="1.0.0 (Build 100)" />

        <DescriptionBox description={t('app_description')} />

        {/* Informasi Aplikasi */}
        <AboutSection title={t('app_info')}>
          {appInfo.map((item, index) => (
            <InfoRow key={index} label={item.label} value={item.value} />
          ))}
        </AboutSection>

        {/* Tim Pengembang */}
        <AboutSection title={t('development_team')}>
          {developers.map((dev, index) => (
            <DeveloperCard
              key={index}
              name={dev.name}
              role={dev.role}
              github={dev.github}
            />
          ))}
        </AboutSection>

        {/* Teknologi */}
        <AboutSection title={t('technology')}>
          <TechStack />
        </AboutSection>

        {/* Link Penting */}
        {/* <AboutSection title={t('important_links')}> */}
          {/* <LinkItem
            icon="github"
            label={t('github_repo')}
            url="https://github.com"
            iconColor={isDarkMode ? '#fff' : '#333'}
          />
          <LinkItem
            icon="web"
            label={t('official_website')}
            url="https://chatku.com"
          /> */}
        {/* </AboutSection> */}

        <AboutFooter year={2026} license="MIT License" />
      </ScrollView>
    </View>
  );
};

export default AboutScreen;