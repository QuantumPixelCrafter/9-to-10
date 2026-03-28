export type LangCode =
  | "en" | "zh-TW" | "zh-CN" | "ja" | "ko"
  | "fr" | "de" | "es" | "pt" | "it"
  | "id" | "ms" | "nl" | "sv" | "no"
  | "da" | "fi" | "ru" | "pl" | "el"
  | "tr" | "ar" | "th" | "vi" | "hi"
  | "bn" | "fil" | "si" | "ur";

export interface LanguageDef {
  code: LangCode;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  countryCodes: string[];
}

export const LANGUAGES: LanguageDef[] = [
  { code: "en",    name: "English",                    nativeName: "English",          flag: "🇬🇧", countryCodes: ["AU","BD","CA","GH","IN","ID","IE","KE","MY","NG","NZ","PH","PK","SG","ZA","LK","GB","US"] },
  { code: "zh-TW", name: "Traditional Chinese",        nativeName: "繁體中文",           flag: "🇭🇰", countryCodes: ["HK","MO","TW"] },
  { code: "zh-CN", name: "Simplified Chinese",         nativeName: "简体中文",           flag: "🇨🇳", countryCodes: ["CN"] },
  { code: "ja",    name: "Japanese",                   nativeName: "日本語",             flag: "🇯🇵", countryCodes: ["JP"] },
  { code: "ko",    name: "Korean",                     nativeName: "한국어",             flag: "🇰🇷", countryCodes: ["KR"] },
  { code: "fr",    name: "French",                     nativeName: "Français",          flag: "🇫🇷", countryCodes: ["FR","BE","CH"] },
  { code: "de",    name: "German",                     nativeName: "Deutsch",           flag: "🇩🇪", countryCodes: ["DE","AT","CH","NL"] },
  { code: "es",    name: "Spanish",                    nativeName: "Español",           flag: "🇪🇸", countryCodes: ["ES","MX","CO","AR","CL"] },
  { code: "pt",    name: "Portuguese",                 nativeName: "Português",         flag: "🇧🇷", countryCodes: ["BR","PT"] },
  { code: "it",    name: "Italian",                    nativeName: "Italiano",          flag: "🇮🇹", countryCodes: ["IT"] },
  { code: "id",    name: "Indonesian",                 nativeName: "Bahasa Indonesia",  flag: "🇮🇩", countryCodes: ["ID"] },
  { code: "ms",    name: "Malay",                      nativeName: "Bahasa Melayu",     flag: "🇲🇾", countryCodes: ["MY","SG"] },
  { code: "nl",    name: "Dutch",                      nativeName: "Nederlands",        flag: "🇳🇱", countryCodes: ["NL","BE"] },
  { code: "sv",    name: "Swedish",                    nativeName: "Svenska",           flag: "🇸🇪", countryCodes: ["SE"] },
  { code: "no",    name: "Norwegian",                  nativeName: "Norsk",             flag: "🇳🇴", countryCodes: ["NO"] },
  { code: "da",    name: "Danish",                     nativeName: "Dansk",             flag: "🇩🇰", countryCodes: ["DK"] },
  { code: "fi",    name: "Finnish",                    nativeName: "Suomi",             flag: "🇫🇮", countryCodes: ["FI"] },
  { code: "ru",    name: "Russian",                    nativeName: "Русский",           flag: "🇷🇺", countryCodes: ["RU"] },
  { code: "pl",    name: "Polish",                     nativeName: "Polski",            flag: "🇵🇱", countryCodes: ["PL"] },
  { code: "el",    name: "Greek",                      nativeName: "Ελληνικά",          flag: "🇬🇷", countryCodes: ["GR"] },
  { code: "tr",    name: "Turkish",                    nativeName: "Türkçe",            flag: "🇹🇷", countryCodes: ["TR"] },
  { code: "ar",    name: "Arabic",                     nativeName: "العربية",           flag: "🇸🇦", rtl: true,  countryCodes: ["SA","AE","EG"] },
  { code: "th",    name: "Thai",                       nativeName: "ภาษาไทย",            flag: "🇹🇭", countryCodes: ["TH"] },
  { code: "vi",    name: "Vietnamese",                 nativeName: "Tiếng Việt",        flag: "🇻🇳", countryCodes: ["VN"] },
  { code: "hi",    name: "Hindi",                      nativeName: "हिन्दी",              flag: "🇮🇳", countryCodes: ["IN"] },
  { code: "bn",    name: "Bengali",                    nativeName: "বাংলা",              flag: "🇧🇩", countryCodes: ["BD"] },
  { code: "fil",   name: "Filipino",                   nativeName: "Filipino",          flag: "🇵🇭", countryCodes: ["PH"] },
  { code: "si",    name: "Sinhala",                    nativeName: "සිංහල",              flag: "🇱🇰", countryCodes: ["LK"] },
  { code: "ur",    name: "Urdu",                       nativeName: "اردو",              flag: "🇵🇰", rtl: true,  countryCodes: ["PK"] },
];

export function getLanguage(code: string): LanguageDef | undefined {
  return LANGUAGES.find(l => l.code === code);
}

export function getDefaultLanguageForCountry(countryCode: string): LangCode {
  const lang = LANGUAGES.find(l => l.countryCodes.includes(countryCode));
  return lang?.code ?? "en";
}

export interface Translations {
  nav: {
    dashboard: string;
    notes: string;
    timetable: string;
    goals: string;
    calendar: string;
    mood: string;
    minigames: string;
    objectives: string;
    leaderboard: string;
    achievements: string;
    quiz: string;
    review: string;
    shop: string;
    inbox: string;
    friends: string;
    devPanel: string;
    profile: string;
    preferences: string;
    logout: string;
    supportUs: string;
  };
  common: {
    save: string;
    cancel: string;
    submit: string;
    loading: string;
    error: string;
    back: string;
    continue: string;
    login: string;
    signup: string;
    createAccount: string;
    alreadyHaveAccount: string;
    logIn: string;
  };
  signup: {
    language: string;
    languageSub: string;
    country: string;
    countrySub: string;
    grade: string;
    account: string;
    accountSub: string;
    searchCountry: string;
    noResults: string;
    selectGrade: string;
    username: string;
    usernamePlaceholder: string;
    usernameHint: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    passwordsNoMatch: string;
    passwordTooShort: string;
    creating: string;
    passwordChecks: {
      length: string;
      number: string;
      letter: string;
    };
  };
}

const en: Translations = {
  nav: {
    dashboard: "Dashboard", notes: "Notes & Subjects", timetable: "Timetable",
    goals: "Goals", calendar: "Calendar", mood: "Mood Check-in",
    minigames: "Minigames", objectives: "Objectives", leaderboard: "Leaderboard",
    achievements: "Achievements", quiz: "AI Quiz", review: "Review",
    shop: "Shop", inbox: "Inbox", friends: "Friends",
    devPanel: "Dev Panel", profile: "Profile", preferences: "Preferences", logout: "Log out", supportUs: "Support Us",
  },
  common: {
    save: "Save", cancel: "Cancel", submit: "Submit", loading: "Loading…",
    error: "Error", back: "Back", continue: "Continue", login: "Log in",
    signup: "Sign up", createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?", logIn: "Log in",
  },
  signup: {
    language: "Choose your language", languageSub: "You can change this later in Preferences.",
    country: "Where do you study?", countrySub: "Search for your country or region.",
    grade: "What grade are you in?", account: "Create your account", accountSub: "Almost there! Set your username and password.",
    searchCountry: "Search country or region…", noResults: "No results found",
    selectGrade: "Select a grade to continue", username: "Username",
    usernamePlaceholder: "your_username", usernameHint: "Letters, numbers, and underscores only. At least 3 characters.",
    password: "Password", passwordPlaceholder: "Create a password",
    confirmPassword: "Confirm password", confirmPasswordPlaceholder: "Repeat your password",
    passwordsNoMatch: "Passwords do not match.", passwordTooShort: "Password must be at least 6 characters.",
    creating: "Creating account…",
    passwordChecks: { length: "At least 6 characters", number: "Contains a number", letter: "Contains a letter" },
  },
};

const zhTW: Translations = {
  nav: {
    dashboard: "主頁", notes: "筆記與科目", timetable: "時間表",
    goals: "目標", calendar: "行事曆", mood: "心情記錄",
    minigames: "小遊戲", objectives: "任務", leaderboard: "排行榜",
    achievements: "成就", quiz: "AI 測驗", review: "複習",
    shop: "商店", inbox: "收件箱", friends: "朋友",
    devPanel: "開發者面板", profile: "個人資料", preferences: "偏好設定", logout: "登出", supportUs: "支持我們",
  },
  common: {
    save: "儲存", cancel: "取消", submit: "提交", loading: "載入中…",
    error: "錯誤", back: "返回", continue: "繼續", login: "登入",
    signup: "註冊", createAccount: "建立帳戶",
    alreadyHaveAccount: "已有帳戶？", logIn: "登入",
  },
  signup: {
    language: "選擇語言", languageSub: "您可以稍後在偏好設定中更改。",
    country: "您在哪裡就讀？", countrySub: "搜尋您的國家或地區。",
    grade: "您就讀哪個年級？", account: "建立您的帳戶", accountSub: "快完成了！請設定您的用戶名和密碼。",
    searchCountry: "搜尋國家或地區…", noResults: "找不到結果",
    selectGrade: "請選擇年級以繼續", username: "用戶名",
    usernamePlaceholder: "your_username", usernameHint: "只可使用字母、數字和下劃線，至少 3 個字元。",
    password: "密碼", passwordPlaceholder: "建立密碼",
    confirmPassword: "確認密碼", confirmPasswordPlaceholder: "重複輸入密碼",
    passwordsNoMatch: "兩次密碼不一致。", passwordTooShort: "密碼至少需要 6 個字元。",
    creating: "正在建立帳戶…",
    passwordChecks: { length: "至少 6 個字元", number: "包含數字", letter: "包含字母" },
  },
};

const zhCN: Translations = {
  nav: {
    dashboard: "主页", notes: "笔记与科目", timetable: "课程表",
    goals: "目标", calendar: "日历", mood: "心情记录",
    minigames: "小游戏", objectives: "任务", leaderboard: "排行榜",
    achievements: "成就", quiz: "AI 测验", review: "复习",
    shop: "商店", inbox: "收件箱", friends: "朋友",
    devPanel: "开发者面板", profile: "个人资料", preferences: "偏好设置", logout: "退出登录", supportUs: "支持我们",
  },
  common: {
    save: "保存", cancel: "取消", submit: "提交", loading: "加载中…",
    error: "错误", back: "返回", continue: "继续", login: "登录",
    signup: "注册", createAccount: "创建账户",
    alreadyHaveAccount: "已有账户？", logIn: "登录",
  },
  signup: {
    language: "选择语言", languageSub: "您可以稍后在偏好设置中更改。",
    country: "您在哪里就读？", countrySub: "搜索您的国家或地区。",
    grade: "您就读哪个年级？", account: "创建您的账户", accountSub: "快完成了！请设置您的用户名和密码。",
    searchCountry: "搜索国家或地区…", noResults: "未找到结果",
    selectGrade: "请选择年级以继续", username: "用户名",
    usernamePlaceholder: "your_username", usernameHint: "只能使用字母、数字和下划线，至少 3 个字符。",
    password: "密码", passwordPlaceholder: "创建密码",
    confirmPassword: "确认密码", confirmPasswordPlaceholder: "重复输入密码",
    passwordsNoMatch: "两次密码不一致。", passwordTooShort: "密码至少需要 6 个字符。",
    creating: "正在创建账户…",
    passwordChecks: { length: "至少 6 个字符", number: "包含数字", letter: "包含字母" },
  },
};

const ja: Translations = {
  nav: {
    dashboard: "ダッシュボード", notes: "ノートと科目", timetable: "時間割",
    goals: "目標", calendar: "カレンダー", mood: "気分チェック",
    minigames: "ミニゲーム", objectives: "課題", leaderboard: "ランキング",
    achievements: "実績", quiz: "AIクイズ", review: "復習",
    shop: "ショップ", inbox: "受信箱", friends: "フレンド",
    devPanel: "開発パネル", profile: "プロフィール", preferences: "設定", logout: "ログアウト", supportUs: "応援する",
  },
  common: {
    save: "保存", cancel: "キャンセル", submit: "送信", loading: "読み込み中…",
    error: "エラー", back: "戻る", continue: "次へ", login: "ログイン",
    signup: "新規登録", createAccount: "アカウントを作成",
    alreadyHaveAccount: "すでにアカウントをお持ちですか？", logIn: "ログイン",
  },
  signup: {
    language: "言語を選択", languageSub: "後で設定から変更できます。",
    country: "どこで勉強していますか？", countrySub: "国または地域を検索してください。",
    grade: "何年生ですか？", account: "アカウントを作成", accountSub: "もう少し！ユーザー名とパスワードを設定してください。",
    searchCountry: "国または地域を検索…", noResults: "結果が見つかりません",
    selectGrade: "学年を選択して続行", username: "ユーザー名",
    usernamePlaceholder: "your_username", usernameHint: "英数字とアンダースコアのみ。3文字以上。",
    password: "パスワード", passwordPlaceholder: "パスワードを作成",
    confirmPassword: "パスワードの確認", confirmPasswordPlaceholder: "パスワードを再入力",
    passwordsNoMatch: "パスワードが一致しません。", passwordTooShort: "パスワードは6文字以上にしてください。",
    creating: "アカウントを作成中…",
    passwordChecks: { length: "6文字以上", number: "数字を含む", letter: "文字を含む" },
  },
};

const ko: Translations = {
  nav: {
    dashboard: "대시보드", notes: "노트 및 과목", timetable: "시간표",
    goals: "목표", calendar: "달력", mood: "기분 체크",
    minigames: "미니게임", objectives: "과제", leaderboard: "리더보드",
    achievements: "업적", quiz: "AI 퀴즈", review: "복습",
    shop: "상점", inbox: "받은 편지함", friends: "친구",
    devPanel: "개발자 패널", profile: "프로필", preferences: "환경설정", logout: "로그아웃", supportUs: "후원하기",
  },
  common: {
    save: "저장", cancel: "취소", submit: "제출", loading: "로딩 중…",
    error: "오류", back: "뒤로", continue: "계속", login: "로그인",
    signup: "회원가입", createAccount: "계정 만들기",
    alreadyHaveAccount: "이미 계정이 있으신가요?", logIn: "로그인",
  },
  signup: {
    language: "언어 선택", languageSub: "나중에 설정에서 변경할 수 있습니다.",
    country: "어디서 공부하고 계신가요?", countrySub: "국가 또는 지역을 검색하세요.",
    grade: "몇 학년인가요?", account: "계정 만들기", accountSub: "거의 다 됐어요! 사용자 이름과 비밀번호를 설정하세요.",
    searchCountry: "국가 또는 지역 검색…", noResults: "결과 없음",
    selectGrade: "학년을 선택하여 계속", username: "사용자 이름",
    usernamePlaceholder: "your_username", usernameHint: "영문자, 숫자, 밑줄만 사용 가능. 최소 3자.",
    password: "비밀번호", passwordPlaceholder: "비밀번호 만들기",
    confirmPassword: "비밀번호 확인", confirmPasswordPlaceholder: "비밀번호 다시 입력",
    passwordsNoMatch: "비밀번호가 일치하지 않습니다.", passwordTooShort: "비밀번호는 최소 6자 이상이어야 합니다.",
    creating: "계정 생성 중…",
    passwordChecks: { length: "최소 6자", number: "숫자 포함", letter: "문자 포함" },
  },
};

const fr: Translations = {
  nav: {
    dashboard: "Tableau de bord", notes: "Notes et matières", timetable: "Emploi du temps",
    goals: "Objectifs", calendar: "Calendrier", mood: "Suivi de l'humeur",
    minigames: "Mini-jeux", objectives: "Missions", leaderboard: "Classement",
    achievements: "Succès", quiz: "Quiz IA", review: "Révision",
    shop: "Boutique", inbox: "Messages", friends: "Amis",
    devPanel: "Panneau Dev", profile: "Profil", preferences: "Préférences", logout: "Déconnexion", supportUs: "Nous soutenir",
  },
  common: {
    save: "Enregistrer", cancel: "Annuler", submit: "Soumettre", loading: "Chargement…",
    error: "Erreur", back: "Retour", continue: "Continuer", login: "Connexion",
    signup: "S'inscrire", createAccount: "Créer un compte",
    alreadyHaveAccount: "Vous avez déjà un compte ?", logIn: "Se connecter",
  },
  signup: {
    language: "Choisissez votre langue", languageSub: "Vous pourrez la modifier plus tard dans les préférences.",
    country: "Où étudiez-vous ?", countrySub: "Recherchez votre pays ou région.",
    grade: "Quelle est votre classe ?", account: "Créez votre compte", accountSub: "Presque terminé ! Définissez votre nom d'utilisateur et mot de passe.",
    searchCountry: "Rechercher un pays ou région…", noResults: "Aucun résultat",
    selectGrade: "Sélectionnez une classe pour continuer", username: "Nom d'utilisateur",
    usernamePlaceholder: "votre_pseudo", usernameHint: "Lettres, chiffres et tirets bas uniquement. Au moins 3 caractères.",
    password: "Mot de passe", passwordPlaceholder: "Créer un mot de passe",
    confirmPassword: "Confirmer le mot de passe", confirmPasswordPlaceholder: "Répétez votre mot de passe",
    passwordsNoMatch: "Les mots de passe ne correspondent pas.", passwordTooShort: "Le mot de passe doit comporter au moins 6 caractères.",
    creating: "Création du compte…",
    passwordChecks: { length: "Au moins 6 caractères", number: "Contient un chiffre", letter: "Contient une lettre" },
  },
};

const de: Translations = {
  nav: {
    dashboard: "Übersicht", notes: "Notizen & Fächer", timetable: "Stundenplan",
    goals: "Ziele", calendar: "Kalender", mood: "Stimmungs-Check",
    minigames: "Minispiele", objectives: "Aufgaben", leaderboard: "Rangliste",
    achievements: "Erfolge", quiz: "KI-Quiz", review: "Wiederholung",
    shop: "Shop", inbox: "Posteingang", friends: "Freunde",
    devPanel: "Entwickler-Panel", profile: "Profil", preferences: "Einstellungen", logout: "Abmelden", supportUs: "Unterstützen",
  },
  common: {
    save: "Speichern", cancel: "Abbrechen", submit: "Absenden", loading: "Lädt…",
    error: "Fehler", back: "Zurück", continue: "Weiter", login: "Anmelden",
    signup: "Registrieren", createAccount: "Konto erstellen",
    alreadyHaveAccount: "Bereits ein Konto?", logIn: "Anmelden",
  },
  signup: {
    language: "Sprache auswählen", languageSub: "Sie können dies später in den Einstellungen ändern.",
    country: "Wo studieren Sie?", countrySub: "Suchen Sie Ihr Land oder Ihre Region.",
    grade: "In welcher Klasse sind Sie?", account: "Konto erstellen", accountSub: "Fast geschafft! Legen Sie Benutzernamen und Passwort fest.",
    searchCountry: "Land oder Region suchen…", noResults: "Keine Ergebnisse",
    selectGrade: "Klasse auswählen, um fortzufahren", username: "Benutzername",
    usernamePlaceholder: "dein_name", usernameHint: "Nur Buchstaben, Ziffern und Unterstriche. Mindestens 3 Zeichen.",
    password: "Passwort", passwordPlaceholder: "Passwort erstellen",
    confirmPassword: "Passwort bestätigen", confirmPasswordPlaceholder: "Passwort wiederholen",
    passwordsNoMatch: "Passwörter stimmen nicht überein.", passwordTooShort: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    creating: "Konto wird erstellt…",
    passwordChecks: { length: "Mindestens 6 Zeichen", number: "Enthält eine Zahl", letter: "Enthält einen Buchstaben" },
  },
};

const es: Translations = {
  nav: {
    dashboard: "Panel principal", notes: "Notas y materias", timetable: "Horario",
    goals: "Metas", calendar: "Calendario", mood: "Control de ánimo",
    minigames: "Minijuegos", objectives: "Objetivos", leaderboard: "Clasificación",
    achievements: "Logros", quiz: "Quiz IA", review: "Repaso",
    shop: "Tienda", inbox: "Bandeja de entrada", friends: "Amigos",
    devPanel: "Panel Dev", profile: "Perfil", preferences: "Preferencias", logout: "Cerrar sesión", supportUs: "Apóyanos",
  },
  common: {
    save: "Guardar", cancel: "Cancelar", submit: "Enviar", loading: "Cargando…",
    error: "Error", back: "Atrás", continue: "Continuar", login: "Iniciar sesión",
    signup: "Registrarse", createAccount: "Crear cuenta",
    alreadyHaveAccount: "¿Ya tienes una cuenta?", logIn: "Iniciar sesión",
  },
  signup: {
    language: "Elige tu idioma", languageSub: "Puedes cambiarlo más tarde en Preferencias.",
    country: "¿Dónde estudias?", countrySub: "Busca tu país o región.",
    grade: "¿En qué grado estás?", account: "Crea tu cuenta", accountSub: "¡Casi listo! Establece tu nombre de usuario y contraseña.",
    searchCountry: "Buscar país o región…", noResults: "Sin resultados",
    selectGrade: "Selecciona un grado para continuar", username: "Nombre de usuario",
    usernamePlaceholder: "tu_nombre", usernameHint: "Solo letras, números y guiones bajos. Al menos 3 caracteres.",
    password: "Contraseña", passwordPlaceholder: "Crear una contraseña",
    confirmPassword: "Confirmar contraseña", confirmPasswordPlaceholder: "Repite tu contraseña",
    passwordsNoMatch: "Las contraseñas no coinciden.", passwordTooShort: "La contraseña debe tener al menos 6 caracteres.",
    creating: "Creando cuenta…",
    passwordChecks: { length: "Al menos 6 caracteres", number: "Contiene un número", letter: "Contiene una letra" },
  },
};

const pt: Translations = {
  nav: {
    dashboard: "Painel", notes: "Notas e matérias", timetable: "Horário",
    goals: "Metas", calendar: "Calendário", mood: "Registo de humor",
    minigames: "Minijogos", objectives: "Objetivos", leaderboard: "Classificação",
    achievements: "Conquistas", quiz: "Quiz IA", review: "Revisão",
    shop: "Loja", inbox: "Caixa de entrada", friends: "Amigos",
    devPanel: "Painel Dev", profile: "Perfil", preferences: "Preferências", logout: "Sair", supportUs: "Apoie-nos",
  },
  common: {
    save: "Guardar", cancel: "Cancelar", submit: "Enviar", loading: "A carregar…",
    error: "Erro", back: "Voltar", continue: "Continuar", login: "Entrar",
    signup: "Registar", createAccount: "Criar conta",
    alreadyHaveAccount: "Já tem uma conta?", logIn: "Entrar",
  },
  signup: {
    language: "Escolha o seu idioma", languageSub: "Pode alterar mais tarde nas Preferências.",
    country: "Onde estuda?", countrySub: "Pesquise o seu país ou região.",
    grade: "Que ano frequenta?", account: "Crie a sua conta", accountSub: "Quase lá! Defina o seu nome de utilizador e palavra-passe.",
    searchCountry: "Pesquisar país ou região…", noResults: "Sem resultados",
    selectGrade: "Selecione um ano para continuar", username: "Nome de utilizador",
    usernamePlaceholder: "o_seu_nome", usernameHint: "Apenas letras, números e underscores. Pelo menos 3 caracteres.",
    password: "Palavra-passe", passwordPlaceholder: "Criar palavra-passe",
    confirmPassword: "Confirmar palavra-passe", confirmPasswordPlaceholder: "Repetir palavra-passe",
    passwordsNoMatch: "As palavras-passe não coincidem.", passwordTooShort: "A palavra-passe deve ter pelo menos 6 caracteres.",
    creating: "A criar conta…",
    passwordChecks: { length: "Pelo menos 6 caracteres", number: "Contém um número", letter: "Contém uma letra" },
  },
};

const it: Translations = {
  nav: {
    dashboard: "Bacheca", notes: "Note e materie", timetable: "Orario",
    goals: "Obiettivi", calendar: "Calendario", mood: "Stato d'animo",
    minigames: "Minigiochi", objectives: "Attività", leaderboard: "Classifica",
    achievements: "Traguardi", quiz: "Quiz IA", review: "Ripasso",
    shop: "Negozio", inbox: "Messaggi", friends: "Amici",
    devPanel: "Pannello Dev", profile: "Profilo", preferences: "Preferenze", logout: "Esci", supportUs: "Supportaci",
  },
  common: {
    save: "Salva", cancel: "Annulla", submit: "Invia", loading: "Caricamento…",
    error: "Errore", back: "Indietro", continue: "Continua", login: "Accedi",
    signup: "Registrati", createAccount: "Crea account",
    alreadyHaveAccount: "Hai già un account?", logIn: "Accedi",
  },
  signup: {
    language: "Scegli la tua lingua", languageSub: "Puoi cambiarlo in seguito nelle Preferenze.",
    country: "Dove studi?", countrySub: "Cerca il tuo paese o regione.",
    grade: "In che classe sei?", account: "Crea il tuo account", accountSub: "Quasi fatto! Imposta username e password.",
    searchCountry: "Cerca paese o regione…", noResults: "Nessun risultato",
    selectGrade: "Seleziona una classe per continuare", username: "Nome utente",
    usernamePlaceholder: "il_tuo_nome", usernameHint: "Solo lettere, numeri e underscore. Almeno 3 caratteri.",
    password: "Password", passwordPlaceholder: "Crea una password",
    confirmPassword: "Conferma password", confirmPasswordPlaceholder: "Ripeti la password",
    passwordsNoMatch: "Le password non corrispondono.", passwordTooShort: "La password deve essere di almeno 6 caratteri.",
    creating: "Creazione account…",
    passwordChecks: { length: "Almeno 6 caratteri", number: "Contiene un numero", letter: "Contiene una lettera" },
  },
};

const id: Translations = {
  nav: {
    dashboard: "Beranda", notes: "Catatan & Mata Pelajaran", timetable: "Jadwal",
    goals: "Tujuan", calendar: "Kalender", mood: "Cek Suasana Hati",
    minigames: "Minigame", objectives: "Misi", leaderboard: "Papan Peringkat",
    achievements: "Pencapaian", quiz: "Kuis AI", review: "Ulasan",
    shop: "Toko", inbox: "Kotak Masuk", friends: "Teman",
    devPanel: "Panel Dev", profile: "Profil", preferences: "Preferensi", logout: "Keluar", supportUs: "Dukung Kami",
  },
  common: {
    save: "Simpan", cancel: "Batal", submit: "Kirim", loading: "Memuat…",
    error: "Kesalahan", back: "Kembali", continue: "Lanjutkan", login: "Masuk",
    signup: "Daftar", createAccount: "Buat Akun",
    alreadyHaveAccount: "Sudah punya akun?", logIn: "Masuk",
  },
  signup: {
    language: "Pilih bahasa Anda", languageSub: "Anda dapat mengubahnya nanti di Preferensi.",
    country: "Di mana Anda belajar?", countrySub: "Cari negara atau wilayah Anda.",
    grade: "Anda kelas berapa?", account: "Buat akun Anda", accountSub: "Hampir selesai! Atur nama pengguna dan kata sandi Anda.",
    searchCountry: "Cari negara atau wilayah…", noResults: "Tidak ada hasil",
    selectGrade: "Pilih kelas untuk melanjutkan", username: "Nama Pengguna",
    usernamePlaceholder: "nama_pengguna", usernameHint: "Hanya huruf, angka, dan garis bawah. Minimal 3 karakter.",
    password: "Kata Sandi", passwordPlaceholder: "Buat kata sandi",
    confirmPassword: "Konfirmasi Kata Sandi", confirmPasswordPlaceholder: "Ulangi kata sandi",
    passwordsNoMatch: "Kata sandi tidak cocok.", passwordTooShort: "Kata sandi harus minimal 6 karakter.",
    creating: "Membuat akun…",
    passwordChecks: { length: "Minimal 6 karakter", number: "Mengandung angka", letter: "Mengandung huruf" },
  },
};

const ms: Translations = {
  nav: {
    dashboard: "Papan Pemuka", notes: "Nota & Mata Pelajaran", timetable: "Jadual",
    goals: "Matlamat", calendar: "Kalendar", mood: "Semak Mood",
    minigames: "Mini Permainan", objectives: "Objektif", leaderboard: "Papan Kedudukan",
    achievements: "Pencapaian", quiz: "Kuiz AI", review: "Ulangkaji",
    shop: "Kedai", inbox: "Peti Masuk", friends: "Rakan",
    devPanel: "Panel Dev", profile: "Profil", preferences: "Keutamaan", logout: "Log Keluar", supportUs: "Sokong Kami",
  },
  common: {
    save: "Simpan", cancel: "Batal", submit: "Hantar", loading: "Memuatkan…",
    error: "Ralat", back: "Kembali", continue: "Teruskan", login: "Log Masuk",
    signup: "Daftar", createAccount: "Buat Akaun",
    alreadyHaveAccount: "Sudah mempunyai akaun?", logIn: "Log Masuk",
  },
  signup: {
    language: "Pilih bahasa anda", languageSub: "Anda boleh mengubahnya kemudian dalam Keutamaan.",
    country: "Di mana anda belajar?", countrySub: "Cari negara atau wilayah anda.",
    grade: "Anda berada di tingkatan berapa?", account: "Buat akaun anda", accountSub: "Hampir selesai! Tetapkan nama pengguna dan kata laluan anda.",
    searchCountry: "Cari negara atau wilayah…", noResults: "Tiada hasil",
    selectGrade: "Pilih tingkatan untuk meneruskan", username: "Nama Pengguna",
    usernamePlaceholder: "nama_pengguna", usernameHint: "Huruf, nombor dan garis bawah sahaja. Sekurang-kurangnya 3 aksara.",
    password: "Kata Laluan", passwordPlaceholder: "Buat kata laluan",
    confirmPassword: "Sahkan Kata Laluan", confirmPasswordPlaceholder: "Ulang kata laluan",
    passwordsNoMatch: "Kata laluan tidak sepadan.", passwordTooShort: "Kata laluan mestilah sekurang-kurangnya 6 aksara.",
    creating: "Mencipta akaun…",
    passwordChecks: { length: "Sekurang-kurangnya 6 aksara", number: "Mengandungi nombor", letter: "Mengandungi huruf" },
  },
};

const nl: Translations = {
  nav: {
    dashboard: "Dashboard", notes: "Notities & Vakken", timetable: "Rooster",
    goals: "Doelen", calendar: "Kalender", mood: "Stemming Bijhouden",
    minigames: "Minispelletjes", objectives: "Opdrachten", leaderboard: "Ranglijst",
    achievements: "Prestaties", quiz: "AI Quiz", review: "Herhaling",
    shop: "Winkel", inbox: "Inbox", friends: "Vrienden",
    devPanel: "Dev-paneel", profile: "Profiel", preferences: "Voorkeuren", logout: "Uitloggen", supportUs: "Steun Ons",
  },
  common: {
    save: "Opslaan", cancel: "Annuleren", submit: "Verzenden", loading: "Laden…",
    error: "Fout", back: "Terug", continue: "Doorgaan", login: "Inloggen",
    signup: "Registreren", createAccount: "Account aanmaken",
    alreadyHaveAccount: "Al een account?", logIn: "Inloggen",
  },
  signup: {
    language: "Kies uw taal", languageSub: "U kunt dit later wijzigen in Voorkeuren.",
    country: "Waar studeert u?", countrySub: "Zoek uw land of regio.",
    grade: "In welke klas zit u?", account: "Maak uw account aan", accountSub: "Bijna klaar! Stel uw gebruikersnaam en wachtwoord in.",
    searchCountry: "Zoek land of regio…", noResults: "Geen resultaten",
    selectGrade: "Selecteer een klas om door te gaan", username: "Gebruikersnaam",
    usernamePlaceholder: "uw_naam", usernameHint: "Alleen letters, cijfers en underscores. Minimaal 3 tekens.",
    password: "Wachtwoord", passwordPlaceholder: "Maak een wachtwoord",
    confirmPassword: "Bevestig wachtwoord", confirmPasswordPlaceholder: "Herhaal uw wachtwoord",
    passwordsNoMatch: "Wachtwoorden komen niet overeen.", passwordTooShort: "Het wachtwoord moet minimaal 6 tekens bevatten.",
    creating: "Account aanmaken…",
    passwordChecks: { length: "Minimaal 6 tekens", number: "Bevat een cijfer", letter: "Bevat een letter" },
  },
};

const sv: Translations = {
  nav: {
    dashboard: "Instrumentpanel", notes: "Anteckningar & Ämnen", timetable: "Schema",
    goals: "Mål", calendar: "Kalender", mood: "Humörregistrering",
    minigames: "Minispel", objectives: "Uppdrag", leaderboard: "Topplista",
    achievements: "Prestationer", quiz: "AI-quiz", review: "Repetition",
    shop: "Butik", inbox: "Inkorg", friends: "Vänner",
    devPanel: "Utvecklarpanel", profile: "Profil", preferences: "Inställningar", logout: "Logga ut", supportUs: "Stöd Oss",
  },
  common: {
    save: "Spara", cancel: "Avbryt", submit: "Skicka", loading: "Laddar…",
    error: "Fel", back: "Tillbaka", continue: "Fortsätt", login: "Logga in",
    signup: "Registrera", createAccount: "Skapa konto",
    alreadyHaveAccount: "Har du redan ett konto?", logIn: "Logga in",
  },
  signup: {
    language: "Välj ditt språk", languageSub: "Du kan ändra detta senare i Inställningar.",
    country: "Var studerar du?", countrySub: "Sök efter ditt land eller region.",
    grade: "Vilken klass går du i?", account: "Skapa ditt konto", accountSub: "Nästan klart! Ange användarnamn och lösenord.",
    searchCountry: "Sök land eller region…", noResults: "Inga resultat",
    selectGrade: "Välj en klass för att fortsätta", username: "Användarnamn",
    usernamePlaceholder: "ditt_namn", usernameHint: "Endast bokstäver, siffror och understreck. Minst 3 tecken.",
    password: "Lösenord", passwordPlaceholder: "Skapa ett lösenord",
    confirmPassword: "Bekräfta lösenord", confirmPasswordPlaceholder: "Upprepa lösenordet",
    passwordsNoMatch: "Lösenorden matchar inte.", passwordTooShort: "Lösenordet måste vara minst 6 tecken.",
    creating: "Skapar konto…",
    passwordChecks: { length: "Minst 6 tecken", number: "Innehåller en siffra", letter: "Innehåller en bokstav" },
  },
};

const no: Translations = {
  nav: {
    dashboard: "Dashbord", notes: "Notater & Fag", timetable: "Timeplan",
    goals: "Mål", calendar: "Kalender", mood: "Humørsjekk",
    minigames: "Minispill", objectives: "Oppdrag", leaderboard: "Toppliste",
    achievements: "Prestasjoner", quiz: "AI-quiz", review: "Repetisjon",
    shop: "Butikk", inbox: "Innboks", friends: "Venner",
    devPanel: "Utviklerpanel", profile: "Profil", preferences: "Innstillinger", logout: "Logg ut", supportUs: "Støtt Oss",
  },
  common: {
    save: "Lagre", cancel: "Avbryt", submit: "Send", loading: "Laster…",
    error: "Feil", back: "Tilbake", continue: "Fortsett", login: "Logg inn",
    signup: "Registrer", createAccount: "Opprett konto",
    alreadyHaveAccount: "Har du allerede en konto?", logIn: "Logg inn",
  },
  signup: {
    language: "Velg ditt språk", languageSub: "Du kan endre dette senere i Innstillinger.",
    country: "Hvor studerer du?", countrySub: "Søk etter ditt land eller region.",
    grade: "Hvilken klasse er du i?", account: "Opprett kontoen din", accountSub: "Nesten ferdig! Angi brukernavn og passord.",
    searchCountry: "Søk land eller region…", noResults: "Ingen resultater",
    selectGrade: "Velg en klasse for å fortsette", username: "Brukernavn",
    usernamePlaceholder: "ditt_navn", usernameHint: "Kun bokstaver, tall og understreker. Minst 3 tegn.",
    password: "Passord", passwordPlaceholder: "Opprett et passord",
    confirmPassword: "Bekreft passord", confirmPasswordPlaceholder: "Gjenta passordet",
    passwordsNoMatch: "Passordene stemmer ikke overens.", passwordTooShort: "Passordet må være minst 6 tegn.",
    creating: "Oppretter konto…",
    passwordChecks: { length: "Minst 6 tegn", number: "Inneholder et tall", letter: "Inneholder en bokstav" },
  },
};

const da: Translations = {
  nav: {
    dashboard: "Dashboard", notes: "Notater & Fag", timetable: "Skema",
    goals: "Mål", calendar: "Kalender", mood: "Humørregistrering",
    minigames: "Minispil", objectives: "Opgaver", leaderboard: "Toprangliste",
    achievements: "Præstationer", quiz: "AI-quiz", review: "Repetition",
    shop: "Butik", inbox: "Indbakke", friends: "Venner",
    devPanel: "Udviklerpanel", profile: "Profil", preferences: "Præferencer", logout: "Log ud", supportUs: "Støt Os",
  },
  common: {
    save: "Gem", cancel: "Annuller", submit: "Send", loading: "Indlæser…",
    error: "Fejl", back: "Tilbage", continue: "Fortsæt", login: "Log ind",
    signup: "Tilmeld dig", createAccount: "Opret konto",
    alreadyHaveAccount: "Har du allerede en konto?", logIn: "Log ind",
  },
  signup: {
    language: "Vælg dit sprog", languageSub: "Du kan ændre dette senere i Præferencer.",
    country: "Hvor studerer du?", countrySub: "Søg efter dit land eller region.",
    grade: "Hvilken klasse er du i?", account: "Opret din konto", accountSub: "Næsten færdig! Angiv brugernavn og adgangskode.",
    searchCountry: "Søg land eller region…", noResults: "Ingen resultater",
    selectGrade: "Vælg en klasse for at fortsætte", username: "Brugernavn",
    usernamePlaceholder: "dit_navn", usernameHint: "Kun bogstaver, tal og understreger. Mindst 3 tegn.",
    password: "Adgangskode", passwordPlaceholder: "Opret en adgangskode",
    confirmPassword: "Bekræft adgangskode", confirmPasswordPlaceholder: "Gentag adgangskoden",
    passwordsNoMatch: "Adgangskoderne stemmer ikke overens.", passwordTooShort: "Adgangskoden skal være mindst 6 tegn.",
    creating: "Opretter konto…",
    passwordChecks: { length: "Mindst 6 tegn", number: "Indeholder et tal", letter: "Indeholder et bogstav" },
  },
};

const fi: Translations = {
  nav: {
    dashboard: "Kojelauta", notes: "Muistiinpanot & Aineet", timetable: "Lukujärjestys",
    goals: "Tavoitteet", calendar: "Kalenteri", mood: "Mielialaseuranta",
    minigames: "Minipelit", objectives: "Tehtävät", leaderboard: "Pisteytyslista",
    achievements: "Saavutukset", quiz: "AI-tietovisa", review: "Kertaus",
    shop: "Kauppa", inbox: "Saapuneet", friends: "Ystävät",
    devPanel: "Kehittäjäpaneeli", profile: "Profiili", preferences: "Asetukset", logout: "Kirjaudu ulos", supportUs: "Tue Meitä",
  },
  common: {
    save: "Tallenna", cancel: "Peruuta", submit: "Lähetä", loading: "Ladataan…",
    error: "Virhe", back: "Takaisin", continue: "Jatka", login: "Kirjaudu",
    signup: "Rekisteröidy", createAccount: "Luo tili",
    alreadyHaveAccount: "Onko sinulla jo tili?", logIn: "Kirjaudu",
  },
  signup: {
    language: "Valitse kielesi", languageSub: "Voit vaihtaa sen myöhemmin Asetuksista.",
    country: "Missä opiskelet?", countrySub: "Hae maasi tai alueesi.",
    grade: "Millä luokalla olet?", account: "Luo tilisi", accountSub: "Melkein valmis! Aseta käyttäjänimesi ja salasanasi.",
    searchCountry: "Hae maata tai aluetta…", noResults: "Ei tuloksia",
    selectGrade: "Valitse luokka jatkaaksesi", username: "Käyttäjänimi",
    usernamePlaceholder: "nimesi", usernameHint: "Vain kirjaimet, numerot ja alaviivat. Vähintään 3 merkkiä.",
    password: "Salasana", passwordPlaceholder: "Luo salasana",
    confirmPassword: "Vahvista salasana", confirmPasswordPlaceholder: "Toista salasana",
    passwordsNoMatch: "Salasanat eivät täsmää.", passwordTooShort: "Salasanan on oltava vähintään 6 merkkiä.",
    creating: "Luodaan tiliä…",
    passwordChecks: { length: "Vähintään 6 merkkiä", number: "Sisältää numeron", letter: "Sisältää kirjaimen" },
  },
};

const ru: Translations = {
  nav: {
    dashboard: "Главная", notes: "Заметки и предметы", timetable: "Расписание",
    goals: "Цели", calendar: "Календарь", mood: "Настроение",
    minigames: "Мини-игры", objectives: "Задания", leaderboard: "Рейтинг",
    achievements: "Достижения", quiz: "ИИ-викторина", review: "Повторение",
    shop: "Магазин", inbox: "Входящие", friends: "Друзья",
    devPanel: "Панель разработчика", profile: "Профиль", preferences: "Настройки", logout: "Выйти", supportUs: "Поддержать нас",
  },
  common: {
    save: "Сохранить", cancel: "Отмена", submit: "Отправить", loading: "Загрузка…",
    error: "Ошибка", back: "Назад", continue: "Продолжить", login: "Войти",
    signup: "Регистрация", createAccount: "Создать аккаунт",
    alreadyHaveAccount: "Уже есть аккаунт?", logIn: "Войти",
  },
  signup: {
    language: "Выберите язык", languageSub: "Вы можете изменить это позже в Настройках.",
    country: "Где вы учитесь?", countrySub: "Найдите свою страну или регион.",
    grade: "В каком вы классе?", account: "Создайте аккаунт", accountSub: "Почти готово! Задайте имя пользователя и пароль.",
    searchCountry: "Поиск страны или региона…", noResults: "Результаты не найдены",
    selectGrade: "Выберите класс, чтобы продолжить", username: "Имя пользователя",
    usernamePlaceholder: "ваше_имя", usernameHint: "Только буквы, цифры и нижнее подчёркивание. Не менее 3 символов.",
    password: "Пароль", passwordPlaceholder: "Создайте пароль",
    confirmPassword: "Подтвердите пароль", confirmPasswordPlaceholder: "Повторите пароль",
    passwordsNoMatch: "Пароли не совпадают.", passwordTooShort: "Пароль должен содержать не менее 6 символов.",
    creating: "Создание аккаунта…",
    passwordChecks: { length: "Не менее 6 символов", number: "Содержит цифру", letter: "Содержит букву" },
  },
};

const pl: Translations = {
  nav: {
    dashboard: "Pulpit", notes: "Notatki i przedmioty", timetable: "Plan zajęć",
    goals: "Cele", calendar: "Kalendarz", mood: "Sprawdzenie humoru",
    minigames: "Minigry", objectives: "Zadania", leaderboard: "Ranking",
    achievements: "Osiągnięcia", quiz: "Quiz AI", review: "Powtórzenie",
    shop: "Sklep", inbox: "Skrzynka odbiorcza", friends: "Znajomi",
    devPanel: "Panel deweloperski", profile: "Profil", preferences: "Preferencje", logout: "Wyloguj się", supportUs: "Wspieraj Nas",
  },
  common: {
    save: "Zapisz", cancel: "Anuluj", submit: "Wyślij", loading: "Ładowanie…",
    error: "Błąd", back: "Wstecz", continue: "Kontynuuj", login: "Zaloguj się",
    signup: "Zarejestruj się", createAccount: "Utwórz konto",
    alreadyHaveAccount: "Masz już konto?", logIn: "Zaloguj się",
  },
  signup: {
    language: "Wybierz swój język", languageSub: "Możesz to zmienić później w Preferencjach.",
    country: "Gdzie studiujesz?", countrySub: "Wyszukaj swój kraj lub region.",
    grade: "W której klasie jesteś?", account: "Utwórz swoje konto", accountSub: "Prawie gotowe! Ustaw nazwę użytkownika i hasło.",
    searchCountry: "Szukaj kraju lub regionu…", noResults: "Brak wyników",
    selectGrade: "Wybierz klasę, aby kontynuować", username: "Nazwa użytkownika",
    usernamePlaceholder: "twoja_nazwa", usernameHint: "Tylko litery, cyfry i podkreślenia. Co najmniej 3 znaki.",
    password: "Hasło", passwordPlaceholder: "Utwórz hasło",
    confirmPassword: "Potwierdź hasło", confirmPasswordPlaceholder: "Powtórz hasło",
    passwordsNoMatch: "Hasła nie są zgodne.", passwordTooShort: "Hasło musi mieć co najmniej 6 znaków.",
    creating: "Tworzenie konta…",
    passwordChecks: { length: "Co najmniej 6 znaków", number: "Zawiera cyfrę", letter: "Zawiera literę" },
  },
};

const el: Translations = {
  nav: {
    dashboard: "Πίνακας ελέγχου", notes: "Σημειώσεις & Μαθήματα", timetable: "Πρόγραμμα",
    goals: "Στόχοι", calendar: "Ημερολόγιο", mood: "Καταγραφή Διάθεσης",
    minigames: "Μικροπαιχνίδια", objectives: "Αποστολές", leaderboard: "Κατάταξη",
    achievements: "Επιτεύγματα", quiz: "Κουίζ ΑΙ", review: "Επανάληψη",
    shop: "Κατάστημα", inbox: "Εισερχόμενα", friends: "Φίλοι",
    devPanel: "Πάνελ Dev", profile: "Προφίλ", preferences: "Προτιμήσεις", logout: "Αποσύνδεση", supportUs: "Υποστήριξέ Μας",
  },
  common: {
    save: "Αποθήκευση", cancel: "Ακύρωση", submit: "Υποβολή", loading: "Φόρτωση…",
    error: "Σφάλμα", back: "Πίσω", continue: "Συνέχεια", login: "Σύνδεση",
    signup: "Εγγραφή", createAccount: "Δημιουργία λογαριασμού",
    alreadyHaveAccount: "Έχετε ήδη λογαριασμό;", logIn: "Σύνδεση",
  },
  signup: {
    language: "Επιλέξτε τη γλώσσα σας", languageSub: "Μπορείτε να το αλλάξετε αργότερα στις Προτιμήσεις.",
    country: "Πού σπουδάζετε;", countrySub: "Αναζητήστε τη χώρα ή περιοχή σας.",
    grade: "Σε ποια τάξη είστε;", account: "Δημιουργήστε τον λογαριασμό σας", accountSub: "Σχεδόν τελείωσε! Ορίστε το όνομα χρήστη και τον κωδικό σας.",
    searchCountry: "Αναζήτηση χώρας ή περιοχής…", noResults: "Δεν βρέθηκαν αποτελέσματα",
    selectGrade: "Επιλέξτε τάξη για να συνεχίσετε", username: "Όνομα χρήστη",
    usernamePlaceholder: "το_ονομα_σου", usernameHint: "Μόνο γράμματα, αριθμοί και κάτω παύλες. Τουλάχιστον 3 χαρακτήρες.",
    password: "Κωδικός", passwordPlaceholder: "Δημιουργήστε κωδικό",
    confirmPassword: "Επιβεβαίωση κωδικού", confirmPasswordPlaceholder: "Επαναλάβετε τον κωδικό",
    passwordsNoMatch: "Οι κωδικοί δεν ταιριάζουν.", passwordTooShort: "Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες.",
    creating: "Δημιουργία λογαριασμού…",
    passwordChecks: { length: "Τουλάχιστον 6 χαρακτήρες", number: "Περιέχει αριθμό", letter: "Περιέχει γράμμα" },
  },
};

const tr: Translations = {
  nav: {
    dashboard: "Kontrol Paneli", notes: "Notlar ve Dersler", timetable: "Ders Programı",
    goals: "Hedefler", calendar: "Takvim", mood: "Ruh Hali Kaydı",
    minigames: "Mini Oyunlar", objectives: "Görevler", leaderboard: "Sıralama",
    achievements: "Başarılar", quiz: "AI Sınavı", review: "Tekrar",
    shop: "Mağaza", inbox: "Gelen Kutusu", friends: "Arkadaşlar",
    devPanel: "Geliştirici Paneli", profile: "Profil", preferences: "Tercihler", logout: "Çıkış yap", supportUs: "Bizi Destekle",
  },
  common: {
    save: "Kaydet", cancel: "İptal", submit: "Gönder", loading: "Yükleniyor…",
    error: "Hata", back: "Geri", continue: "Devam et", login: "Giriş yap",
    signup: "Kayıt ol", createAccount: "Hesap oluştur",
    alreadyHaveAccount: "Zaten hesabınız var mı?", logIn: "Giriş yap",
  },
  signup: {
    language: "Dilinizi seçin", languageSub: "Bunu daha sonra Tercihler'den değiştirebilirsiniz.",
    country: "Nerede okuyorsunuz?", countrySub: "Ülkenizi veya bölgenizi arayın.",
    grade: "Hangi sınıftasınız?", account: "Hesabınızı oluşturun", accountSub: "Neredeyse bitti! Kullanıcı adı ve şifrenizi belirleyin.",
    searchCountry: "Ülke veya bölge ara…", noResults: "Sonuç bulunamadı",
    selectGrade: "Devam etmek için sınıf seçin", username: "Kullanıcı Adı",
    usernamePlaceholder: "kullanici_adi", usernameHint: "Yalnızca harf, rakam ve alt çizgi. En az 3 karakter.",
    password: "Şifre", passwordPlaceholder: "Şifre oluşturun",
    confirmPassword: "Şifreyi onayla", confirmPasswordPlaceholder: "Şifreyi tekrar girin",
    passwordsNoMatch: "Şifreler eşleşmiyor.", passwordTooShort: "Şifre en az 6 karakter olmalıdır.",
    creating: "Hesap oluşturuluyor…",
    passwordChecks: { length: "En az 6 karakter", number: "Rakam içeriyor", letter: "Harf içeriyor" },
  },
};

const ar: Translations = {
  nav: {
    dashboard: "لوحة التحكم", notes: "الملاحظات والمواد", timetable: "الجدول الدراسي",
    goals: "الأهداف", calendar: "التقويم", mood: "تتبع المزاج",
    minigames: "الألعاب الصغيرة", objectives: "المهام", leaderboard: "لوحة المتصدرين",
    achievements: "الإنجازات", quiz: "اختبار الذكاء الاصطناعي", review: "المراجعة",
    shop: "المتجر", inbox: "صندوق الوارد", friends: "الأصدقاء",
    devPanel: "لوحة المطور", profile: "الملف الشخصي", preferences: "التفضيلات", logout: "تسجيل الخروج", supportUs: "ادعمنا",
  },
  common: {
    save: "حفظ", cancel: "إلغاء", submit: "إرسال", loading: "جارٍ التحميل…",
    error: "خطأ", back: "رجوع", continue: "متابعة", login: "تسجيل الدخول",
    signup: "إنشاء حساب", createAccount: "إنشاء حساب",
    alreadyHaveAccount: "هل لديك حساب بالفعل؟", logIn: "تسجيل الدخول",
  },
  signup: {
    language: "اختر لغتك", languageSub: "يمكنك تغيير ذلك لاحقاً في التفضيلات.",
    country: "أين تدرس؟", countrySub: "ابحث عن بلدك أو منطقتك.",
    grade: "في أي صف أنت؟", account: "إنشاء حسابك", accountSub: "اكتملت تقريباً! حدد اسم المستخدم وكلمة المرور.",
    searchCountry: "ابحث عن بلد أو منطقة…", noResults: "لا توجد نتائج",
    selectGrade: "اختر صفاً للمتابعة", username: "اسم المستخدم",
    usernamePlaceholder: "اسم_المستخدم", usernameHint: "الأحرف والأرقام والشرطة السفلية فقط. 3 أحرف على الأقل.",
    password: "كلمة المرور", passwordPlaceholder: "إنشاء كلمة مرور",
    confirmPassword: "تأكيد كلمة المرور", confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    passwordsNoMatch: "كلمتا المرور غير متطابقتين.", passwordTooShort: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
    creating: "جارٍ إنشاء الحساب…",
    passwordChecks: { length: "6 أحرف على الأقل", number: "يحتوي على رقم", letter: "يحتوي على حرف" },
  },
};

const th: Translations = {
  nav: {
    dashboard: "หน้าหลัก", notes: "บันทึกและวิชา", timetable: "ตารางเรียน",
    goals: "เป้าหมาย", calendar: "ปฏิทิน", mood: "บันทึกอารมณ์",
    minigames: "มินิเกมส์", objectives: "ภารกิจ", leaderboard: "ลีดเดอร์บอร์ด",
    achievements: "ความสำเร็จ", quiz: "แบบทดสอบ AI", review: "ทบทวน",
    shop: "ร้านค้า", inbox: "กล่องข้อความ", friends: "เพื่อน",
    devPanel: "แผงนักพัฒนา", profile: "โปรไฟล์", preferences: "การตั้งค่า", logout: "ออกจากระบบ", supportUs: "สนับสนุนเรา",
  },
  common: {
    save: "บันทึก", cancel: "ยกเลิก", submit: "ส่ง", loading: "กำลังโหลด…",
    error: "ข้อผิดพลาด", back: "กลับ", continue: "ต่อไป", login: "เข้าสู่ระบบ",
    signup: "สมัครสมาชิก", createAccount: "สร้างบัญชี",
    alreadyHaveAccount: "มีบัญชีอยู่แล้ว?", logIn: "เข้าสู่ระบบ",
  },
  signup: {
    language: "เลือกภาษาของคุณ", languageSub: "คุณสามารถเปลี่ยนได้ในภายหลังใน การตั้งค่า",
    country: "คุณเรียนที่ไหน?", countrySub: "ค้นหาประเทศหรือภูมิภาคของคุณ",
    grade: "คุณอยู่ชั้นอะไร?", account: "สร้างบัญชีของคุณ", accountSub: "ใกล้เสร็จแล้ว! ตั้งชื่อผู้ใช้และรหัสผ่าน",
    searchCountry: "ค้นหาประเทศหรือภูมิภาค…", noResults: "ไม่พบผลลัพธ์",
    selectGrade: "เลือกชั้นเรียนเพื่อดำเนินการต่อ", username: "ชื่อผู้ใช้",
    usernamePlaceholder: "ชื่อผู้ใช้", usernameHint: "ใช้ตัวอักษร ตัวเลข และขีดล่างเท่านั้น อย่างน้อย 3 ตัวอักษร",
    password: "รหัสผ่าน", passwordPlaceholder: "สร้างรหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน", confirmPasswordPlaceholder: "ยืนยันรหัสผ่านอีกครั้ง",
    passwordsNoMatch: "รหัสผ่านไม่ตรงกัน", passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    creating: "กำลังสร้างบัญชี…",
    passwordChecks: { length: "อย่างน้อย 6 ตัวอักษร", number: "มีตัวเลข", letter: "มีตัวอักษร" },
  },
};

const vi: Translations = {
  nav: {
    dashboard: "Trang chủ", notes: "Ghi chú & Môn học", timetable: "Thời khóa biểu",
    goals: "Mục tiêu", calendar: "Lịch", mood: "Ghi chép tâm trạng",
    minigames: "Trò chơi nhỏ", objectives: "Nhiệm vụ", leaderboard: "Bảng xếp hạng",
    achievements: "Thành tích", quiz: "Bài kiểm tra AI", review: "Ôn tập",
    shop: "Cửa hàng", inbox: "Hộp thư", friends: "Bạn bè",
    devPanel: "Bảng phát triển", profile: "Hồ sơ", preferences: "Tùy chọn", logout: "Đăng xuất", supportUs: "Ủng Hộ Chúng Tôi",
  },
  common: {
    save: "Lưu", cancel: "Hủy", submit: "Gửi", loading: "Đang tải…",
    error: "Lỗi", back: "Quay lại", continue: "Tiếp tục", login: "Đăng nhập",
    signup: "Đăng ký", createAccount: "Tạo tài khoản",
    alreadyHaveAccount: "Đã có tài khoản?", logIn: "Đăng nhập",
  },
  signup: {
    language: "Chọn ngôn ngữ của bạn", languageSub: "Bạn có thể thay đổi sau trong Tùy chọn.",
    country: "Bạn học ở đâu?", countrySub: "Tìm kiếm quốc gia hoặc vùng của bạn.",
    grade: "Bạn đang học lớp mấy?", account: "Tạo tài khoản của bạn", accountSub: "Gần xong rồi! Đặt tên người dùng và mật khẩu.",
    searchCountry: "Tìm kiếm quốc gia hoặc vùng…", noResults: "Không tìm thấy kết quả",
    selectGrade: "Chọn lớp để tiếp tục", username: "Tên người dùng",
    usernamePlaceholder: "ten_nguoi_dung", usernameHint: "Chỉ chữ cái, số và dấu gạch dưới. Ít nhất 3 ký tự.",
    password: "Mật khẩu", passwordPlaceholder: "Tạo mật khẩu",
    confirmPassword: "Xác nhận mật khẩu", confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    passwordsNoMatch: "Mật khẩu không khớp.", passwordTooShort: "Mật khẩu phải có ít nhất 6 ký tự.",
    creating: "Đang tạo tài khoản…",
    passwordChecks: { length: "Ít nhất 6 ký tự", number: "Có chứa số", letter: "Có chứa chữ cái" },
  },
};

const hi: Translations = {
  nav: {
    dashboard: "मुख्य पृष्ठ", notes: "नोट्स और विषय", timetable: "समय-सारणी",
    goals: "लक्ष्य", calendar: "कैलेंडर", mood: "मूड चेक-इन",
    minigames: "मिनी गेम्स", objectives: "कार्य", leaderboard: "लीडरबोर्ड",
    achievements: "उपलब्धियाँ", quiz: "AI क्विज़", review: "पुनरावलोकन",
    shop: "दुकान", inbox: "इनबॉक्स", friends: "मित्र",
    devPanel: "डेव पैनल", profile: "प्रोफ़ाइल", preferences: "प्राथमिकताएँ", logout: "लॉग आउट", supportUs: "हमें सहयोग दें",
  },
  common: {
    save: "सहेजें", cancel: "रद्द करें", submit: "जमा करें", loading: "लोड हो रहा है…",
    error: "त्रुटि", back: "वापस", continue: "जारी रखें", login: "लॉग इन",
    signup: "साइन अप", createAccount: "खाता बनाएं",
    alreadyHaveAccount: "पहले से खाता है?", logIn: "लॉग इन",
  },
  signup: {
    language: "अपनी भाषा चुनें", languageSub: "आप इसे बाद में प्राथमिकताओं में बदल सकते हैं।",
    country: "आप कहाँ पढ़ते हैं?", countrySub: "अपना देश या क्षेत्र खोजें।",
    grade: "आप किस कक्षा में हैं?", account: "अपना खाता बनाएं", accountSub: "लगभग हो गया! अपना उपयोगकर्ता नाम और पासवर्ड सेट करें।",
    searchCountry: "देश या क्षेत्र खोजें…", noResults: "कोई परिणाम नहीं मिला",
    selectGrade: "जारी रखने के लिए कक्षा चुनें", username: "उपयोगकर्ता नाम",
    usernamePlaceholder: "your_username", usernameHint: "केवल अक्षर, संख्याएं और अंडरस्कोर। कम से कम 3 अक्षर।",
    password: "पासवर्ड", passwordPlaceholder: "पासवर्ड बनाएं",
    confirmPassword: "पासवर्ड की पुष्टि करें", confirmPasswordPlaceholder: "पासवर्ड दोहराएं",
    passwordsNoMatch: "पासवर्ड मेल नहीं खाते।", passwordTooShort: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
    creating: "खाता बनाया जा रहा है…",
    passwordChecks: { length: "कम से कम 6 अक्षर", number: "संख्या शामिल है", letter: "अक्षर शामिल है" },
  },
};

const bn: Translations = {
  nav: {
    dashboard: "ড্যাশবোর্ড", notes: "নোট ও বিষয়", timetable: "সময়সূচী",
    goals: "লক্ষ্য", calendar: "ক্যালেন্ডার", mood: "মেজাজ পরীক্ষা",
    minigames: "মিনিগেমস", objectives: "কার্যক্রম", leaderboard: "লিডারবোর্ড",
    achievements: "সাফল্য", quiz: "AI কুইজ", review: "পর্যালোচনা",
    shop: "দোকান", inbox: "ইনবক্স", friends: "বন্ধু",
    devPanel: "ডেভ প্যানেল", profile: "প্রোফাইল", preferences: "পছন্দ", logout: "লগ আউট", supportUs: "আমাদের সহায়তা করুন",
  },
  common: {
    save: "সংরক্ষণ", cancel: "বাতিল", submit: "জমা দিন", loading: "লোড হচ্ছে…",
    error: "ত্রুটি", back: "পিছনে", continue: "চালিয়ে যান", login: "লগ ইন",
    signup: "সাইন আপ", createAccount: "অ্যাকাউন্ট তৈরি করুন",
    alreadyHaveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?", logIn: "লগ ইন",
  },
  signup: {
    language: "আপনার ভাষা বেছে নিন", languageSub: "আপনি পরে পছন্দে এটি পরিবর্তন করতে পারবেন।",
    country: "আপনি কোথায় পড়াশোনা করেন?", countrySub: "আপনার দেশ বা অঞ্চল খুঁজুন।",
    grade: "আপনি কোন শ্রেণীতে পড়েন?", account: "আপনার অ্যাকাউন্ট তৈরি করুন", accountSub: "প্রায় শেষ! আপনার ব্যবহারকারীনাম ও পাসওয়ার্ড সেট করুন।",
    searchCountry: "দেশ বা অঞ্চল খুঁজুন…", noResults: "কোনো ফলাফল পাওয়া যায়নি",
    selectGrade: "চালিয়ে যেতে একটি শ্রেণী বেছে নিন", username: "ব্যবহারকারীনাম",
    usernamePlaceholder: "your_username", usernameHint: "শুধুমাত্র অক্ষর, সংখ্যা এবং আন্ডারস্কোর। কমপক্ষে ৩টি অক্ষর।",
    password: "পাসওয়ার্ড", passwordPlaceholder: "পাসওয়ার্ড তৈরি করুন",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন", confirmPasswordPlaceholder: "পাসওয়ার্ড পুনরায় দিন",
    passwordsNoMatch: "পাসওয়ার্ড মিলছে না।", passwordTooShort: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
    creating: "অ্যাকাউন্ট তৈরি হচ্ছে…",
    passwordChecks: { length: "কমপক্ষে ৬ অক্ষর", number: "সংখ্যা রয়েছে", letter: "অক্ষর রয়েছে" },
  },
};

const fil: Translations = {
  nav: {
    dashboard: "Dashboard", notes: "Mga Tala at Paksa", timetable: "Iskedyul",
    goals: "Mga Layunin", calendar: "Kalendaryo", mood: "Pagsusuri ng Mood",
    minigames: "Mga Minilaro", objectives: "Mga Gawain", leaderboard: "Leaderboard",
    achievements: "Mga Tagumpay", quiz: "AI Quiz", review: "Pagsusuri",
    shop: "Tindahan", inbox: "Inbox", friends: "Mga Kaibigan",
    devPanel: "Dev Panel", profile: "Profile", preferences: "Mga Kagustuhan", logout: "Mag-sign out", supportUs: "Suportahan Kami",
  },
  common: {
    save: "I-save", cancel: "I-cancel", submit: "Isumite", loading: "Naglo-load…",
    error: "Error", back: "Bumalik", continue: "Magpatuloy", login: "Mag-log in",
    signup: "Mag-sign up", createAccount: "Gumawa ng Account",
    alreadyHaveAccount: "Mayroon na bang account?", logIn: "Mag-log in",
  },
  signup: {
    language: "Piliin ang iyong wika", languageSub: "Maaari mo itong baguhin sa Mga Kagustuhan mamaya.",
    country: "Saan ka nag-aaral?", countrySub: "Hanapin ang iyong bansa o rehiyon.",
    grade: "Anong baitang ka?", account: "Gumawa ng iyong account", accountSub: "Malapit na! Itakda ang iyong username at password.",
    searchCountry: "Hanapin ang bansa o rehiyon…", noResults: "Walang resulta",
    selectGrade: "Pumili ng baitang para magpatuloy", username: "Username",
    usernamePlaceholder: "your_username", usernameHint: "Mga titik, numero, at underscore lamang. Hindi bababa sa 3 karakter.",
    password: "Password", passwordPlaceholder: "Gumawa ng password",
    confirmPassword: "Kumpirmahin ang password", confirmPasswordPlaceholder: "Ulitin ang password",
    passwordsNoMatch: "Hindi magkatugma ang mga password.", passwordTooShort: "Ang password ay dapat may hindi bababa sa 6 na karakter.",
    creating: "Gumagawa ng account…",
    passwordChecks: { length: "Hindi bababa sa 6 na karakter", number: "Naglalaman ng numero", letter: "Naglalaman ng titik" },
  },
};

const si: Translations = {
  nav: {
    dashboard: "ප්‍රධාන පිටුව", notes: "සටහන් සහ විෂයයන්", timetable: "කාලසටහන",
    goals: "ඉලක්ක", calendar: "දිනදර්ශනය", mood: "මනෝ තත්ත්වය",
    minigames: "කෙටි ක්‍රීඩා", objectives: "කාර්යයන්", leaderboard: "ශ්‍රේණිගත කිරීම",
    achievements: "ජයග්‍රහණ", quiz: "AI ප්‍රශ්නාවලිය", review: "සමාලෝචනය",
    shop: "සාප්පුව", inbox: "ලිපි පෙට්ටිය", friends: "මිතුරන්",
    devPanel: "සංවර්ධක පැනලය", profile: "පැතිකඩ", preferences: "මනාපයන්", logout: "ඉවත් වන්න", supportUs: "අපව සහාය කරන්න",
  },
  common: {
    save: "සුරකින්න", cancel: "අවලංගු කරන්න", submit: "ඉදිරිපත් කරන්න", loading: "පූරණය වෙමින්…",
    error: "දෝෂය", back: "ආපසු", continue: "ඉදිරියට", login: "පිවිසෙන්න",
    signup: "ලියාපදිංචි වන්න", createAccount: "ගිණුම සාදන්න",
    alreadyHaveAccount: "දැනටමත් ගිණුමක් තිබේද?", logIn: "පිවිසෙන්න",
  },
  signup: {
    language: "ඔබේ භාෂාව තෝරන්න", languageSub: "ඔබට මනාපයන් හි පසුව එය වෙනස් කළ හැක.",
    country: "ඔබ ඉගෙනීම කොහෙද?", countrySub: "ඔබේ රටේ හෝ ප්‍රදේශය සොයන්න.",
    grade: "ඔබ කුමන ශ්‍රේණියේ දැ?", account: "ඔබේ ගිණුම සාදන්න", accountSub: "ආසන්නයේ! ඔබේ පරිශීලක නාමය සහ මුරපදය සකසන්න.",
    searchCountry: "රටේ හෝ ප්‍රදේශය සොයන්න…", noResults: "ප්‍රතිඵල නොමැත",
    selectGrade: "ඉදිරියට යාමට ශ්‍රේණියක් තෝරන්න", username: "පරිශීලක නාමය",
    usernamePlaceholder: "your_username", usernameHint: "අකුරු, සංඛ්‍යා සහ underscore පමණයි. අවම 3 අක්ෂර.",
    password: "මුරපදය", passwordPlaceholder: "මුරපදයක් සාදන්න",
    confirmPassword: "මුරපදය තහවුරු කරන්න", confirmPasswordPlaceholder: "මුරපදය නැවත ලියන්න",
    passwordsNoMatch: "මුරපද නොගැළපේ.", passwordTooShort: "මුරපදය අවම 6 අක්ෂර විය යුතුය.",
    creating: "ගිණුම සාදමින්…",
    passwordChecks: { length: "අවම 6 අක්ෂර", number: "සංඛ්‍යාවක් ඇත", letter: "අකුරක් ඇත" },
  },
};

const ur: Translations = {
  nav: {
    dashboard: "ڈیش بورڈ", notes: "نوٹس اور مضامین", timetable: "وقت کا جدول",
    goals: "اہداف", calendar: "کیلنڈر", mood: "موڈ چیک",
    minigames: "منی گیمز", objectives: "مقاصد", leaderboard: "لیڈربورڈ",
    achievements: "کامیابیاں", quiz: "AI کوئز", review: "جائزہ",
    shop: "دکان", inbox: "ان باکس", friends: "دوست",
    devPanel: "ڈیو پینل", profile: "پروفائل", preferences: "ترجیحات", logout: "لاگ آؤٹ", supportUs: "ہمیں سپورٹ کریں",
  },
  common: {
    save: "محفوظ کریں", cancel: "منسوخ کریں", submit: "جمع کریں", loading: "لوڈ ہو رہا ہے…",
    error: "خطا", back: "واپس", continue: "جاری رکھیں", login: "لاگ ان",
    signup: "سائن اپ", createAccount: "اکاؤنٹ بنائیں",
    alreadyHaveAccount: "پہلے سے اکاؤنٹ ہے؟", logIn: "لاگ ان",
  },
  signup: {
    language: "اپنی زبان منتخب کریں", languageSub: "آپ بعد میں ترجیحات میں تبدیل کر سکتے ہیں۔",
    country: "آپ کہاں پڑھتے ہیں؟", countrySub: "اپنا ملک یا علاقہ تلاش کریں۔",
    grade: "آپ کس جماعت میں ہیں؟", account: "اپنا اکاؤنٹ بنائیں", accountSub: "تقریباً ہو گیا! اپنا صارف نام اور پاسورڈ سیٹ کریں۔",
    searchCountry: "ملک یا علاقہ تلاش کریں…", noResults: "کوئی نتیجہ نہیں ملا",
    selectGrade: "جاری رکھنے کے لیے جماعت منتخب کریں", username: "صارف نام",
    usernamePlaceholder: "your_username", usernameHint: "صرف حروف، اعداد اور انڈرسکور۔ کم از کم 3 حروف۔",
    password: "پاسورڈ", passwordPlaceholder: "پاسورڈ بنائیں",
    confirmPassword: "پاسورڈ کی تصدیق کریں", confirmPasswordPlaceholder: "پاسورڈ دوبارہ درج کریں",
    passwordsNoMatch: "پاسورڈ مماثل نہیں ہیں۔", passwordTooShort: "پاسورڈ کم از کم 6 حروف کا ہونا چاہیے۔",
    creating: "اکاؤنٹ بنایا جا رہا ہے…",
    passwordChecks: { length: "کم از کم 6 حروف", number: "نمبر شامل ہے", letter: "حرف شامل ہے" },
  },
};

export const TRANSLATIONS: Record<LangCode, Translations> = {
  en, "zh-TW": zhTW, "zh-CN": zhCN, ja, ko,
  fr, de, es, pt, it,
  id, ms, nl, sv, no,
  da, fi, ru, pl, el,
  tr, ar, th, vi, hi,
  bn, fil, si, ur,
};

export function getTranslations(code: LangCode): Translations {
  return TRANSLATIONS[code] ?? TRANSLATIONS["en"];
}
