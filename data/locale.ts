export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "marvel-portfolio-locale:v1";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ja";
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export const siteCopy = {
  en: {
    language: {
      label: "Language",
      english: "EN",
      japanese: "日本語",
    },
    nav: {
      ariaLabel: "Primary navigation",
      mobileAriaLabel: "Mobile navigation",
      home: "Home",
      projects: "Projects",
      lab: "Lab",
      timeline: "Timeline",
      about: "About",
      more: "More",
      closeMore: "Close more menu",
      moreOptions: "More navigation options",
      email: "Email",
      emailMarvel: "Email Marvel Harisson",
      theme: "Theme",
      switchTheme: "Switch theme",
      toggleTheme: "Toggle light or dark theme",
      sleepRadio: "Sleep Radio",
      sleepRadioControls: "Sleep Radio controls",
      openSleepRadio: "Open Sleep Radio preset on Lofi Cafe in a new tab",
      opensNewTab: "opens in a new tab",
      lofiTitle: "Lofi Cafe Sleeping station player",
    },
    home: {
      osakaTimeLabel: "Current time in Osaka",
      location: "Osaka, Japan · 2026",
      updated: "last updated · 2026",
      handle: "Marvel Harisson · INo-xious",
      role: "Software Engineering Student",
      tech: "Python · C++ · Data Automation · Robotics",
      tagline: "Building software foundations through practical projects.",
    },
    projects: {
      metadataTitle: "Projects",
      metadataDescription: "Practical systems, experiments, and software foundations by Marvel Harisson.",
      title: "Projects",
      description: "Practical systems, experiments, and foundations.",
      galleryLabel: "Project gallery",
      viewCaseStudy: "View project case study",
    },
    caseStudy: {
      back: "Projects",
      onThisPage: "On this page",
      problem: "Problem",
      solution: "Solution",
      built: "What I Built",
      technical: "Technical Details",
      learned: "What I Learned",
      viewRepository: "View repository",
      noRepository: "No public repository linked",
    },
    about: {
      metadataTitle: "About",
      metadataDescription: "About Marvel Harisson, a software engineering student in Osaka.",
      title: "About",
      lead:
        "Hi, I'm Marvel Harisson, a first-year undergraduate at Ritsumeikan University in Osaka, Japan. I'm building my software engineering foundation through practical projects in Python, C++, data automation, and robotics.",
      support:
        "My goal is to learn by building real systems, documenting the process, and gradually developing a specialization in software engineering, robotics, or intelligent systems.",
      cardLabel: "Marvel Harisson profile card",
      identity: {
        name: "Name",
        location: "Location",
        graduation: "Graduation",
        handle: "Handle",
        expectedGraduation: "Expected 2030",
      },
      learningTitle: "Currently learning",
      learning: ["Python", "C++", "Software fundamentals", "Robotics", "System design", "Git and GitHub", "Data automation"],
      interestsTitle: "Interested in",
      interests: ["Robotics", "AI", "Automation", "Chess engines", "Human-computer interaction"],
      beyondCodeTitle: "Beyond code",
      beyondCode: "Chess · Pokémon · FPS games · Minecraft redstone",
    },
    contact: {
      metadataTitle: "Contact",
      metadataDescription: "Contact Marvel Harisson.",
      title: "Contact",
      description:
        "Open to learning opportunities, collaborations, project feedback, and conversations about software engineering, robotics, and practical systems.",
      optionsLabel: "Contact options",
      unpublished: "Unpublished",
    },
    timeline: {
      metadataTitle: "Timeline",
      metadataDescription: "A chronological index of projects and experiences.",
      title: "Timeline",
      description: "A chronological index of projects and experiences.",
    },
    lab: {
      metadataTitle: "Lab",
      metadataDescription: "Current work in progress.",
      title: "Lab",
      description: "Current work in progress.",
      openExternal: "Open",
      ritsumeikanKicker: "Ritsumeikan University · ISSE",
      ritsumeikanTitle: "Ritsumeikan Labs",
      ritsumeikanDescription:
        "Through the Information Systems Science and Engineering course, I take part in project-based learning across five laboratories.",
      visitLab: "Visit",
    },
    notFound: {
      title: "That project is not on the map.",
      returnToProjects: "Return to projects",
    },
  },
  ja: {
    language: {
      label: "表示言語",
      english: "EN",
      japanese: "日本語",
    },
    nav: {
      ariaLabel: "メインナビゲーション",
      mobileAriaLabel: "モバイルナビゲーション",
      home: "ホーム",
      projects: "制作",
      lab: "ラボ",
      timeline: "年表",
      about: "自己紹介",
      more: "その他",
      closeMore: "メニューを閉じる",
      moreOptions: "その他のナビゲーション",
      email: "メール",
      emailMarvel: "Marvel Harisson にメール",
      theme: "テーマ",
      switchTheme: "テーマを切り替え",
      toggleTheme: "ライト/ダークテーマを切り替え",
      sleepRadio: "Sleep Radio",
      sleepRadioControls: "Sleep Radio 操作",
      openSleepRadio: "Lofi Cafe の Sleep Radio プリセットを新しいタブで開く",
      opensNewTab: "新しいタブで開きます",
      lofiTitle: "Lofi Cafe Sleeping station player",
    },
    home: {
      osakaTimeLabel: "大阪の現在時刻",
      location: "大阪、日本 · 2026",
      updated: "最終更新 · 2026",
      handle: "Marvel Harisson · INo-xious",
      role: "ソフトウェア工学を学ぶ学生",
      tech: "Python · C++ · データ自動化 · ロボティクス",
      tagline: "実践的なプロジェクトを通して、ソフトウェアの基礎を積み上げています。",
    },
    projects: {
      metadataTitle: "制作",
      metadataDescription: "Marvel Harisson の実践的なシステム、実験、ソフトウェア基礎プロジェクト。",
      title: "制作",
      description: "実践的なシステム、実験、学習の記録。",
      galleryLabel: "プロジェクトギャラリー",
      viewCaseStudy: "プロジェクト詳細を見る",
    },
    caseStudy: {
      back: "制作",
      onThisPage: "このページ",
      problem: "課題",
      solution: "解決方法",
      built: "作ったもの",
      technical: "技術詳細",
      learned: "学んだこと",
      viewRepository: "リポジトリを見る",
      noRepository: "公開リポジトリは未掲載",
    },
    about: {
      metadataTitle: "自己紹介",
      metadataDescription: "大阪でソフトウェア工学を学ぶ Marvel Harisson について。",
      title: "自己紹介",
      lead:
        "Marvel Harisson です。大阪の立命館大学に在学する学部1回生で、Python、C++、データ自動化、ロボティクスの実践的な制作を通してソフトウェア工学の基礎を学んでいます。",
      support:
        "実際に動くシステムを作り、過程を記録しながら、ソフトウェア工学、ロボティクス、または知能システムの専門性を少しずつ深めることを目標にしています。",
      cardLabel: "Marvel Harisson のプロフィールカード",
      identity: {
        name: "名前",
        location: "拠点",
        graduation: "卒業予定",
        handle: "ハンドル",
        expectedGraduation: "2030年予定",
      },
      learningTitle: "現在学んでいること",
      learning: ["Python", "C++", "ソフトウェア基礎", "ロボティクス", "システム設計", "Git と GitHub", "データ自動化"],
      interestsTitle: "関心領域",
      interests: ["ロボティクス", "AI", "自動化", "チェスエンジン", "ヒューマンコンピュータインタラクション"],
      beyondCodeTitle: "コード以外",
      beyondCode: "チェス · ポケモン · FPSゲーム · Minecraft redstone",
    },
    contact: {
      metadataTitle: "連絡先",
      metadataDescription: "Marvel Harisson への連絡先。",
      title: "連絡先",
      description:
        "学習機会、共同制作、プロジェクトへのフィードバック、ソフトウェア工学・ロボティクス・実践的なシステムについての会話を歓迎しています。",
      optionsLabel: "連絡方法",
      unpublished: "未公開",
    },
    timeline: {
      metadataTitle: "年表",
      metadataDescription: "プロジェクトと経験を時系列でまとめた一覧。",
      title: "年表",
      description: "プロジェクトと経験を時系列でまとめた一覧。",
    },
    lab: {
      metadataTitle: "ラボ",
      metadataDescription: "現在進行中の取り組み。",
      title: "ラボ",
      description: "現在進行中の取り組み。",
      openExternal: "開く",
      ritsumeikanKicker: "立命館大学 · ISSE",
      ritsumeikanTitle: "立命館のラボ",
      ritsumeikanDescription:
        "情報システムサイエンス・エンジニアリングコースでは、5つの研究室を横断するプロジェクト型学習に参加しています。",
      visitLab: "開く",
    },
    notFound: {
      title: "このプロジェクトはマップにありません。",
      returnToProjects: "制作一覧へ戻る",
    },
  },
} as const;
