import Link from "next/link";
import { Search } from "lucide-react";
import { signOutAction } from "@/server/actions/auth.actions";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

const weekdayTimeGreetings = {
  0: {
    morning: "조용한 일요일 아침이에요. 오늘은 마음을 가볍게 두고 천천히 시작해봐요.",
    lunch: "일요일 점심이에요. 맛있게 드시고, 오늘만큼은 조금 느긋해도 괜찮아요.",
    afternoon: "새로운 한 주가 오기 전의 오후예요. 마음부터 천천히 정리해봐요.",
    beforeClose: "하루가 저물어가네요. 내일을 너무 걱정하지 말고, 오늘은 편히 마무리해요."
  },
  1: {
    morning: "월요일이 시작되었네요. 이번 한 주도 너무 급하지 않게, 차근차근 가봐요.",
    lunch: "식사는 하셨나요? 바쁜 오전은 잠시 내려놓고, 맛있게 드시고 푹 쉬어가세요.",
    afternoon: "월요일 오후는 조금 길게 느껴질 수 있어요. 그래도 하나씩 해내면 괜찮을 거예요.",
    beforeClose: "월요일도 거의 지나갔어요. 오늘 하루도 충분히 잘 버텨내셨어요."
  },
  2: {
    morning: "어제보다 조금은 가벼운 아침이었으면 좋겠어요. 오늘도 좋은 흐름으로 시작해봐요.",
    lunch: "점심시간이에요. 잠깐이라도 마음 편하게 쉬는 시간이 되었으면 좋겠어요.",
    afternoon: "오후의 햇살처럼 오늘의 남은 시간도 조금은 따뜻했으면 좋겠어요.",
    beforeClose: "오늘도 여기까지 오느라 고생 많으셨어요. 남은 시간은 조금만 더 가볍게 보내요."
  },
  3: {
    morning: "어느새 한 주의 가운데에 왔네요. 오늘은 스스로를 조금 더 다정하게 챙겨주세요.",
    lunch: "오전을 잘 지나오셨어요. 맛있는 식사로 지친 마음도 잠시 쉬어가면 좋겠어요.",
    afternoon: "수요일 오후는 괜히 지칠 수 있어요. 천천히 숨 고르며 이어가도 괜찮아요.",
    beforeClose: "한 주의 절반을 잘 지나왔어요. 오늘의 끝은 조금 더 편안했으면 좋겠어요."
  },
  4: {
    morning: "주말이 조금씩 가까워지고 있어요. 오늘도 무리하지 말고 천천히 시작해봐요.",
    lunch: "식사는 맛있게 하셨나요? 오후를 위해 잠깐이라도 편히 쉬어가세요.",
    afternoon: "목요일 오후는 마음이 살짝 느려질 때예요. 그래도 잘하고 있으니 괜찮아요.",
    beforeClose: "오늘도 꽤 많은 시간을 지나왔어요. 내일의 나를 위해 조금만 정리하고 쉬어가요."
  },
  5: {
    morning: "드디어 금요일이에요. 이번 주의 마지막 평일도 기분 좋게 시작해봐요.",
    lunch: "금요일 점심이에요. 이번 주도 거의 다 왔으니, 맛있게 먹고 조금만 더 힘내요.",
    afternoon: "주말이 가까워지는 오후예요. 남은 시간도 부드럽게 흘러갔으면 좋겠어요.",
    beforeClose: "이번 주도 정말 고생 많으셨어요. 오늘은 스스로를 충분히 칭찬해줘도 좋아요."
  },
  6: {
    morning: "여유로운 토요일 아침이에요. 오늘은 마음이 조금 더 천천히 움직여도 괜찮아요.",
    lunch: "식사는 하셨나요? 주말의 한가운데에서 잠깐 편안한 시간이 되길 바라요.",
    afternoon: "토요일 오후예요. 해야 할 일이 있어도 너무 무리하지 말고 천천히 해요.",
    beforeClose: "오늘도 잘 보내셨어요. 남은 시간은 조금 더 편안하게 쉬어가세요."
  }
} as const;

type GreetingSlot = "morning" | "lunch" | "afternoon" | "beforeClose";

async function getUserEmail() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user?.email ?? null;
  } catch {
    return null;
  }
}

function getSeoulParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    hour12: false
  }).formatToParts(date);
  const weekdayText = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayText);

  return {
    weekday: weekday >= 0 ? weekday : 1,
    hour
  };
}

function greetingSlot(hour: number): GreetingSlot | "evening" | "lateNight" {
  if (hour >= 5 && hour <= 10) return "morning";
  if (hour >= 11 && hour <= 13) return "lunch";
  if (hour >= 14 && hour <= 17) return "afternoon";
  if (hour >= 18 && hour <= 20) return "evening";
  return "lateNight";
}

function headerGreetingMessage(date = new Date()) {
  const { weekday, hour } = getSeoulParts(date);
  const slot = greetingSlot(hour);

  if (slot === "evening") {
    return "늦은 시간까지 고생 많으셨어요. 너무 무리하지 말고, 천천히 정리해가요.";
  }
  if (slot === "lateNight") {
    return "아직 하루가 끝나지 않았네요. 무리하지 말고, 잠깐씩 쉬어가며 이어가요.";
  }

  return weekdayTimeGreetings[weekday as keyof typeof weekdayTimeGreetings]?.[slot] ?? "오늘도 너무 급하지 않게, 차분히 시작해봐요.";
}

function displayUserName({ email, fullName }: { email?: string | null; fullName?: string | null }) {
  const name = fullName?.trim();
  if (name) return name;

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "사용자";
}

export async function AppHeader({
  email: providedEmail,
  fullName
}: {
  email?: string | null;
  fullName?: string | null;
} = {}) {
  const email = providedEmail ?? await getUserEmail();
  const userName = displayUserName({ email, fullName });
  const greetingMessage = headerGreetingMessage();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link className="focus-ring flex min-w-0 items-center gap-3 rounded-md" href="/dashboard">
          <span className="grid size-9 place-items-center rounded-md bg-blue-700 text-white">
            <Search aria-hidden="true" size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-slate-950">{userName}님, 안녕하세요.</span>
            <span className="hidden max-w-[560px] truncate text-xs text-slate-500 sm:block">{greetingMessage}</span>
          </span>
        </Link>
        {email ? (
          <form action={signOutAction} className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
            <button className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">
              로그아웃
            </button>
          </form>
        ) : (
          <Link className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
