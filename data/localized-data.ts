import { contactLinks, type ContactLink } from "@/data/contact";
import { labItems, type LabItem } from "@/data/lab-items";
import { type Locale, defaultLocale } from "@/data/locale";
import { projects, type CaseStudy, type Project, type ProjectStatus } from "@/data/projects";
import { ritsumeikanLabs, type RitsumeikanLab } from "@/data/ritsumeikan-labs";

type ProjectText = Partial<Pick<Project, "category" | "description" | "imageAlt" | "visualType">> & {
  caseStudy?: Partial<CaseStudy>;
};

const japaneseProjectText: Record<string, ProjectText> = {
  "marveious-style-engine": {
    category: "C++ チェスエンジン / Python データパイプライン",
    description:
      "C++で一から作ったチェスエンジンと、公開されている Chess.com の棋譜から指し手の傾向を学ぶ Python データパイプライン。",
    imageAlt:
      "プレイ可能な盤面、指し手履歴、エンジン設定、探索深度の応答を表示する MarveIous チェスエンジンの画面。",
    visualType: "チェスエンジンのインターフェース",
    caseStudy: {
      problem:
        "チェスエンジンを一から作りながら、公開棋譜からプレイヤーの指し方の傾向をどう扱えるかを試したいと考えました。",
      solution:
        "C++のチェスエンジンと Python のデータパイプラインを組み合わせました。C++側は合法手生成、探索、UCI 風のやり取りに集中し、Python側は公開 Chess.com 棋譜を解析してスタイルに関係する特徴を抽出します。",
      built: [
        "合法手処理",
        "UCI 互換を意識したエンジン構造",
        "Alpha-beta 探索の基礎",
        "Python による PGN と棋譜履歴のパイプライン",
        "公開棋譜からの指し手傾向分析",
        "プロジェクト文書化とベースライン記録",
      ],
      technicalDetails: ["C++ エンジンコア", "Python データ収集と解析", "Chess.com 公開棋譜", "PGN 解析", "探索と評価の基礎"],
      lessons: [
        "チェスエンジンではルール処理の細かさが重要です。",
        "エンジンロジックとデータ分析を分けると構造が整理しやすくなります。",
        "C++は性能が必要な処理に、Pythonはデータ実験に向いています。",
      ],
    },
  },
  "idx-ownership-data-pipeline": {
    category: "Python データ自動化",
    description:
      "インドネシア証券取引所の開示資料を検索し、PDFを解析して所有者テーブルを再構成し、検証したデータを Excel に出力する Python 自動化パイプライン。",
    imageAlt:
      "5%以上の株主開示で絞り込まれた IDX 開示ページに、複数の PDF 結果が表示されている画面。",
    visualType: "IDX 開示ソース",
    caseStudy: {
      problem:
        "インドネシア証券取引所の開示 PDF には有用な所有情報がありますが、半構造化された文書内に閉じ込められているため分析しにくい状態でした。",
      solution:
        "開示資料の検索、関連 PDF のダウンロード、所有者テーブルの再構成、抽出情報の検証、構造化 Excel ワークブックへの出力までを行う Python パイプラインを作りました。",
      built: [
        "文書検索のためのブラウザ自動化",
        "PDF ダウンロードと解析ワークフロー",
        "位置情報を使ったテーブル再構成",
        "データ検証と信頼度の警告",
        "Excel ワークブック出力",
        "Streamlit インターフェース",
      ],
      technicalDetails: ["Python", "Playwright", "pdfplumber", "Pandas", "OpenPyXL", "Streamlit"],
      lessons: [
        "実世界の PDF は形式が不安定で扱いが難しいです。",
        "自動抽出では検証ステップが欠かせません。",
        "最終成果物は非技術者にも使いやすい形にする必要があります。",
        "自動化プロジェクトでは明示的なエラー処理が重要です。",
      ],
    },
  },
  "robotics-soda-task": {
    category: "ロボティクス / ハードウェア設計",
    description:
      "TurtleBot2/Kobuki、アーム、カメラ、A1 RPLiDAR を使って「ソーダを取ってきて」に近い動作を探る初期ロボティクス実験。",
    imageAlt:
      "初期開発中に、部品が入ったケースの上でロボットアームの組み立て部品を手に持っている写真。",
    visualType: "初期ロボティクスハードウェア",
    caseStudy: {
      problem:
        "移動ベース、センサー、カメラ、アームを使って、ロボットが移動し、対象物を検出し、ソーダ缶を取りに行く流れを考える必要がありました。",
      solution:
        "現在の方向性は、移動に Kobuki/TurtleBot2 ベース、ナビゲーションに A1 RPLiDAR、対象物検出にカメラ、把持にロボットアームを組み合わせることです。",
      technicalDetails: ["TurtleBot2 / Kobuki ベース", "A1 RPLiDAR", "カメラ", "ロボットアーム", "物体取得フロー"],
    },
  },
  "pacman-processing-game": {
    category: "Java / Processing / ネットワーク",
    description:
      "グリッド移動、ゲーム状態、AI/サーバー寄りのロジックを練習するために Processing で作った Pac-Man 風ゲーム。",
    imageAlt:
      "青い迷路、幾何学的なプレイヤーと敵のトークン、ネットワーク状態図を含むコンセプトビジュアル。",
    visualType: "迷路とネットワーク状態の検討",
    caseStudy: {
      problem:
        "Processing、移動ロジック、AI/サーバー風のゲーム構造を練習しながら、グリッドベースのゲームを作りたいと考えました。",
      solution:
        "Processing を使って、定義済みの迷路グリッド、ゲーム状態、プレイヤー移動、ペレット、サーバー寄りのロジックを持つ Pac-Man 風ゲームを作りました。",
      built: ["グリッドベースの迷路", "ゲーム状態", "プレイヤー移動", "ペレットと勝敗判定", "AI/サーバー寄りの構造"],
      technicalDetails: ["Processing", "Java 風の構文", "グリッド配列", "ネットワークとサーバーロジックの基礎"],
      lessons: [
        "グリッドベースのゲームでは状態管理が重要です。",
        "移動処理は描画から分けた方が扱いやすくなります。",
        "状態を明確にするとゲームロジックが整理しやすくなります。",
      ],
    },
  },
  "github-profile-readme": {
    category: "ドキュメント / パーソナルブランディング",
    description:
      "技術的な関心、プロジェクト、スキル、学習の方向性を整理して見せるための開発者プロフィール README。",
    imageAlt:
      "大きな赤い MARVEL バナーと Marvel Harisson の学生としての取り組みを紹介する GitHub プロフィール README。",
    visualType: "GitHub プロフィール README",
    caseStudy: {
      problem:
        "プロジェクト、関心、学習の方向性が別々に散らばっていたため、1つの分かりやすい公開エントリーポイントが必要でした。",
      solution:
        "正直な学生紹介、注力している制作、使用ツール、現在の関心、次に探りたい領域を中心に GitHub プロフィール README を構成しました。",
      built: ["プロフィール紹介", "自己紹介と現在の注力領域", "主なプロジェクトリンク", "スキルとツール一覧", "次に探る領域", "ソーシャルリンク"],
      technicalDetails: ["Markdown", "GitHub プロフィールリポジトリ", "相対パスのメディア", "アクセシブルなリンク構造"],
      lessons: [
        "良いドキュメントには階層と整理が必要です。",
        "プロフィールでは現在できることと探索中の領域を分けて書くことが大切です。",
        "公開プロジェクトの説明は、作業の進展に合わせて更新する必要があります。",
      ],
    },
  },
  "marvel-harisson": {
    category: "Next.js / TypeScript / Tailwind CSS",
    description:
      "プロジェクト、年表、連絡先を見せるために Next.js、TypeScript、Tailwind CSS で作った個人サイト。",
    imageAlt:
      "プロジェクトハイライトとナビゲーションリンクを表示する、ダークテーマの個人サイトホーム画面。",
    visualType: "個人サイトのホーム画面",
    caseStudy: {
      problem:
        "プロジェクト、年表、連絡先をプロフェッショナルに見せるための個人サイトが必要でした。",
      solution:
        "サーバーサイドレンダリングに Next.js、型安全性に TypeScript、スタイリングに Tailwind CSS を使って個人サイトを作りました。",
      built: ["Next.js フレームワーク", "TypeScript 統合", "Tailwind CSS スタイリング", "レスポンシブデザイン", "プロジェクト紹介と年表"],
      technicalDetails: ["Next.js", "TypeScript", "Tailwind CSS", "React components", "Responsive web design"],
      lessons: [
        "個人サイトは明確で移動しやすいことが大切です。",
        "モダンなフレームワークを使うと実装を進めやすくなります。",
        "内容を新しく保つには定期的な更新が必要です。",
      ],
    },
  },
};

export const projectStatusLabelsByLocale: Record<Locale, Record<ProjectStatus, string>> = {
  en: {
    "public-repository": "Public repository",
    concept: "Concept",
    experiment: "Experiment",
    documentation: "Documentation",
  },
  ja: {
    "public-repository": "公開リポジトリ",
    concept: "コンセプト",
    experiment: "実験",
    documentation: "ドキュメント",
  },
};

export function getProjects(locale: Locale = defaultLocale): Project[] {
  if (locale === defaultLocale) return projects;

  return projects.map((project) => {
    const translation = japaneseProjectText[project.slug];
    if (!translation) return project;

    return {
      ...project,
      ...translation,
      caseStudy: {
        ...project.caseStudy,
        ...translation.caseStudy,
      },
    };
  });
}

export function getProjectBySlug(slug: string, locale: Locale = defaultLocale): Project | undefined {
  return getProjects(locale).find((project) => project.slug === slug);
}

const japaneseContactText: Record<ContactLink["kind"], Partial<Pick<ContactLink, "label" | "note">>> = {
  github: {
    label: "GitHub",
    note: "公開リポジトリとプロジェクト文書",
  },
  linkedin: {
    label: "LinkedIn",
    note: "大学、関心、活動の更新",
  },
  email: {
    label: "メール",
    note: "直接メールで連絡",
  },
};

export function getContactLinks(locale: Locale = defaultLocale): ContactLink[] {
  if (locale === defaultLocale) return contactLinks;
  return contactLinks.map((link) => ({ ...link, ...japaneseContactText[link.kind] }));
}

export type LocalizedLabItem = LabItem & { linkAriaLabel: string };

const japaneseLabItemText: Record<string, Partial<Pick<LabItem, "category" | "description" | "alt">>> = {
  "rione-home-league": {
    category: "ロボティクス開発",
    description:
      "家庭環境向けサービスロボットを開発する Ri-one @Home League チームでの開発セッション。",
    alt: "ロボティクスラボで、2人の Ri-one メンバーがノートPCと試作ハードウェアを使って作業している写真。",
  },
};

export function getLabItems(locale: Locale = defaultLocale): LocalizedLabItem[] {
  return labItems.map((item) => {
    const translation = locale === "ja" ? japaneseLabItemText[item.id] : undefined;
    const localized = { ...item, ...translation };
    return {
      ...localized,
      linkAriaLabel:
        locale === "ja"
          ? `${localized.title} を Ri-one のサイトで新しいタブで開く`
          : `Open ${localized.title} on the Ri-one website in a new tab`,
    };
  });
}

export type LocalizedRitsumeikanLab = RitsumeikanLab & { linkAriaLabel: string };

const japaneseRitsumeikanLabText: Record<string, Partial<Pick<RitsumeikanLab, "description" | "alt">>> = {
  ice: {
    description: "インタラクティブエンターテインメントとゲーム指向のコンピューティング。",
    alt: "ゲームマップのようなカラフルな画面を表示する Intelligent Computer Entertainment Lab のWebサイト。",
  },
  vine: {
    description: "画像・映像処理、品質評価、ビジュアル符号化、知覚に関する研究。",
    alt: "黒い背景に白い波線がある Visual Information Engineering Laboratory のWebサイト。",
  },
  esoc: {
    description: "学際的で国際的な学習環境における、人間中心のICT。",
    alt: "立命館大学OICの写真を背景にした e-Society Laboratory のWebサイト。",
  },
  dgov: {
    description: "公共サービス、デジタルガバナンス、生活の質のためのICTとデータシステム。",
    alt: "ドットグリッド上に大きな黒いタイトルがある Digital Governance Systems Laboratory のWebサイト。",
  },
  aecal: {
    description: "人間の感覚、感情、感性、インタラクティブアートを中心にしたシステム。",
    alt: "明るい青いヘッダーを持つ Affective Engineering and Computer Arts Lab のWebサイト。",
  },
};

export function getRitsumeikanLabs(locale: Locale = defaultLocale): LocalizedRitsumeikanLab[] {
  return ritsumeikanLabs.map((lab) => {
    const translation = locale === "ja" ? japaneseRitsumeikanLabText[lab.id] : undefined;
    const localized = { ...lab, ...translation };
    return {
      ...localized,
      linkAriaLabel:
        locale === "ja" ? `${localized.name} を新しいタブで開く` : `Visit ${localized.name} in a new tab`,
    };
  });
}
