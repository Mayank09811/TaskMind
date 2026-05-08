import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailyPlan from "@/lib/models/DailyPlan";
import Employee from "@/lib/models/Employee";
import timerManager from "@/lib/timerManager";

const SYSTEM_PROMPT = `You are TaskMind, an experienced Project Manager Bot. Office hours are 10:00 AM – 7:00 PM (IST). You track all task updates across projects.

CORE BEHAVIOR:
- You are professional, friendly, and concise. One question at a time. No long paragraphs.
- You help employees plan their day, track progress, and generate EOD reports.

MORNING CHECK-IN FLOW:
- Greet employee by name.
- Ask: "What's your to-do list for today? Please share each task with an ETA."
- Format expected: "Task name — X hours" (one per line)
- After receiving the list, confirm it back as a table with check-in times and simply state "I will check in with you when the time is up." DO NOT ask any follow-up questions like "Are you ready to start?".

ETA CHECK-IN FLOW (when timer fires):
- Ask if the specific task is completed.
- If "done"/"completed" → mark it done, congratulate briefly, mention the next task.
- If they need more time → ask "How much more time?" and "What's the reason for the delay?"
- If "blocked"/"stuck"/"waiting" → ask "What's blocking you?" and move to next task.

EOD REPORT:
- When all tasks are done, generate a summary table showing each task with planned ETA vs actual time, status, and notes.
- Include: tasks completed, tasks blocked, total productive time, carry-forward items.

SMART DETECTION RULES:
- "blocked" / "stuck" / "waiting" → 🚨 flag as blocked
- "done" / "completed" / "finished" / "complete" → ✅ mark complete
- "delay" / "tomorrow" / "pushed" / "need more" → ⚠️ update ETA
- Any % number → log as progress update
- "no reply" → send one gentle nudge

IMPORTANT:
- Always respond in a structured, easy-to-read format.
- Use emojis sparingly for visual clarity: ✅ 🚨 ⚠️ ⏰ 📊
- When confirming the morning plan, use a markdown table.
- Keep track of which pointer you're asking about from context.
`;

function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split('T')[0];
}

function parsePointers(text: string): { title: string; eta: number }[] {
  const pointers: { title: string; eta: number }[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Match patterns like: "Creating dashboard — 1.5 hours" or "Test — 10s"
    const match = line.match(/(?:\d+[\.\)]\s*)?(.+?)(?:—|-|–)\s*(\d+\.?\d*)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)/i);
    if (match) {
      const title = match[1].trim();
      let eta = parseFloat(match[2]);
      const unit = match[3].toLowerCase();

      // Convert to hours for internal storage
      if (unit.startsWith('m')) {
        eta = eta / 60;
      } else if (unit.startsWith('s')) {
        eta = eta / 3600;
      }

      pointers.push({ title, eta });
    }
  }

  return pointers;
}

function detectSmartKeywords(text: string): {
  isDone: boolean;
  isBlocked: boolean;
  isDelayed: boolean;
  extraTime: number | null;
  progress: number | null;
} {
  const lower = text.toLowerCase();

  const isDone = /\b(done|completed|finished|complete)\b/.test(lower);
  const isBlocked = /\b(blocked|stuck|waiting|blocker)\b/.test(lower);
  const isDelayed = /\b(delay|tomorrow|pushed|need more|more time|extra time)\b/.test(lower);

  // Extract extra time: "30 minutes", "1 hour", "10s"
  let extraTime: number | null = null;
  const timeMatch = lower.match(/(\d+\.?\d*)\s*(?:more\s+)?(?:minutes?|mins?|m)\b/);
  const hourMatch = lower.match(/(\d+\.?\d*)\s*(?:more\s+)?(?:hours?|hrs?|h)\b/);
  const secMatch = lower.match(/(\d+\.?\d*)\s*(?:more\s+)?(?:seconds?|secs?|s)\b/);
  
  if (timeMatch) {
    extraTime = parseFloat(timeMatch[1]) / 60;
  } else if (hourMatch) {
    extraTime = parseFloat(hourMatch[1]);
  } else if (secMatch) {
    extraTime = parseFloat(secMatch[1]) / 3600;
  }

  // Extract progress percentage
  let progress: number | null = null;
  const progressMatch = lower.match(/(\d+)\s*%/);
  if (progressMatch) {
    progress = parseInt(progressMatch[1]);
  }

  return { isDone, isBlocked, isDelayed, extraTime, progress };
}

export async function POST(req: Request) {
  try {
    const { message, history, employeeId } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { error: "Groq API Key not found. Please restart your server." },
        { status: 500 }
      );
    }

    await dbConnect();

    // Get employee info
    let employeeName = "there";
    let employee = null;
    if (employeeId) {
      employee = await Employee.findById(employeeId);
      if (employee) {
        employeeName = employee.name;
      }
    }

    const today = getTodayIST();

    // Get or create today's plan
    let dailyPlan = employeeId
      ? await DailyPlan.findOne({ employee: employeeId, date: today })
      : null;

    // Build context for AI
    let contextMessage = "";

    if (dailyPlan) {
      if (dailyPlan.status === 'active') {
        const currentPointer = dailyPlan.pointers[dailyPlan.currentPointerIndex];
        const completedCount = dailyPlan.pointers.filter(p => p.status === 'done').length;
        const totalCount = dailyPlan.pointers.length;

        contextMessage = `\n\nCONTEXT (do not repeat this verbatim, use it to inform your response):
- Employee: ${employeeName}
- Today's date: ${today}
- Plan status: ${dailyPlan.status}
- Progress: ${completedCount}/${totalCount} pointers completed
- Current active pointer (#${dailyPlan.currentPointerIndex + 1}): "${currentPointer?.title || 'none'}" (Status: ${currentPointer?.status || 'none'})
- All pointers: ${dailyPlan.pointers.map((p, i) => `${i + 1}. "${p.title}" — ${p.plannedETA}h — ${p.status}`).join(', ')}
`;
      } else if (dailyPlan.status === 'collecting') {
        contextMessage = `\n\nCONTEXT: Employee ${employeeName} has started a plan for today but hasn't submitted their to-do list yet. They are in the "collecting" phase. Ask them for their tasks with ETAs.`;
      } else if (dailyPlan.status === 'completed') {
        contextMessage = `\n\nCONTEXT: Employee ${employeeName} has completed all tasks for today. The EOD report has been generated. Respond accordingly if they have follow-up questions.`;
      }
    } else {
      contextMessage = `\n\nCONTEXT: No plan exists for ${employeeName} today (${today}). Start by asking them for their to-do list with ETAs. This is the morning check-in.`;
    }

    // Detect smart keywords in user message
    const detection = detectSmartKeywords(message);

    // Process smart detections against the daily plan
    let actionTaken = "";
    if (dailyPlan && dailyPlan.status === 'active' && employeeId) {
      const currentIdx = dailyPlan.currentPointerIndex;
      const currentPointer = dailyPlan.pointers[currentIdx];

      if (currentPointer && currentPointer.status === 'in_progress') {
        if (detection.isDone) {
          // ... [Done logic remains same]
          currentPointer.status = 'done';
          currentPointer.completedAt = new Date();
          if (currentPointer.startedAt) {
            currentPointer.actualTime =
              (new Date().getTime() - new Date(currentPointer.startedAt).getTime()) / (1000 * 60 * 60);
          }
          timerManager.clearTimer(`${employeeId}_${currentIdx}`);
          const nextIdx = dailyPlan.pointers.findIndex((p, i) => i > currentIdx && p.status !== 'done' && p.status !== 'blocked');
          if (nextIdx !== -1) {
            dailyPlan.currentPointerIndex = nextIdx;
            dailyPlan.pointers[nextIdx].status = 'in_progress';
            dailyPlan.pointers[nextIdx].startedAt = new Date();
            const delayMs = dailyPlan.pointers[nextIdx].plannedETA * 60 * 60 * 1000;
            timerManager.scheduleCheckIn(employeeId, nextIdx, dailyPlan.pointers[nextIdx].title, delayMs);
            actionTaken = `✅ Marked "${currentPointer.title}" as DONE. Started timer for "${dailyPlan.pointers[nextIdx].title}".`;
          } else {
            dailyPlan.status = 'completed';
            dailyPlan.eodReport.generated = true;
            dailyPlan.eodReport.generatedAt = new Date();
            dailyPlan.eodReport.summary = dailyPlan.pointers.map((p, i) => `${i + 1}. ${p.title} — ${p.status}`).join('\n');
            actionTaken = `✅ All pointers completed! EOD report generated.`;
          }
          await dailyPlan.save();
        } 
        // PRIORITIZE DELAY: If extra time is specified, it's a delay, even if the word 'blocker' is used.
        else if (detection.isDelayed && detection.extraTime) {
          currentPointer.status = 'delayed';
          currentPointer.extensions.push({
            extraTime: detection.extraTime,
            reason: message, // Save the whole message as reason
            requestedAt: new Date(),
          });
          const delayMs = detection.extraTime * 60 * 60 * 1000;
          timerManager.scheduleCheckIn(employeeId, currentIdx, currentPointer.title, delayMs);
          actionTaken = `⚠️ Extended "${currentPointer.title}" by ${detection.extraTime.toFixed(2)}h. Timer rescheduled.`;
          await dailyPlan.save();
        }
        else if (detection.isBlocked) {
          currentPointer.status = 'blocked';
          timerManager.clearTimer(`${employeeId}_${currentIdx}`);
          const nextIdx = dailyPlan.pointers.findIndex((p, i) => i > currentIdx && p.status !== 'done' && p.status !== 'blocked');
          if (nextIdx !== -1) {
            dailyPlan.currentPointerIndex = nextIdx;
            dailyPlan.pointers[nextIdx].status = 'in_progress';
            dailyPlan.pointers[nextIdx].startedAt = new Date();
            const delayMs = dailyPlan.pointers[nextIdx].plannedETA * 60 * 60 * 1000;
            timerManager.scheduleCheckIn(employeeId, nextIdx, dailyPlan.pointers[nextIdx].title, delayMs);
          }
          actionTaken = `🚨 Marked "${currentPointer.title}" as BLOCKED. Moving to next pointer.`;
          await dailyPlan.save();
        }
      }

      // Store blocker reason if the previous status was blocked and user is now providing details
      if (currentPointer && currentPointer.status === 'blocked' && !currentPointer.blocker && !detection.isDone) {
        currentPointer.blocker = message;
        await dailyPlan.save();
        actionTaken += ` Blocker reason stored: "${message}"`;
      }

      // Store delay reason
      if (currentPointer && currentPointer.extensions.length > 0) {
        const lastExt = currentPointer.extensions[currentPointer.extensions.length - 1];
        if (!lastExt.reason && !detection.isDone && !detection.isBlocked && !detection.isDelayed) {
          lastExt.reason = message;
          await dailyPlan.save();
          actionTaken += ` Delay reason stored: "${message}"`;
        }
      }
    }

    // Check if the user is submitting a new to-do list
    // Only allow overwriting the plan if we are starting fresh or testing a new round
    const shouldParseNewPlan = !dailyPlan || dailyPlan.status === 'collecting' || dailyPlan.status === 'completed';
    const parsedPointers = parsePointers(message);
    
    if (shouldParseNewPlan && parsedPointers.length >= 1 && employeeId) {
      if (!dailyPlan) {
        dailyPlan = new DailyPlan({
          employee: employeeId,
          date: today,
          status: 'collecting',
          pointers: [],
          currentPointerIndex: 0,
        });
      }

      // Always overwrite the plan if new pointers are provided (allows restarting tests)
      let cumulativeMs = 0;
      const now = new Date();

      dailyPlan.pointers = parsedPointers.map((p, i) => {
        cumulativeMs += p.eta * 60 * 60 * 1000;
        return {
          title: p.title,
          plannedETA: p.eta,
          checkInTime: new Date(now.getTime() + cumulativeMs),
          startedAt: i === 0 ? now : null,
          completedAt: null,
          actualTime: null,
          status: i === 0 ? 'in_progress' : 'pending',
          delayReason: null,
          blocker: null,
          extensions: [],
        };
      });

      dailyPlan.status = 'active';
      dailyPlan.currentPointerIndex = 0;
      dailyPlan.eodReport.generated = false;
      await dailyPlan.save();

      // Schedule timer for first pointer
      const firstEtaMs = parsedPointers[0].eta * 60 * 60 * 1000;
      timerManager.scheduleCheckIn(
        employeeId,
        0,
        parsedPointers[0].title,
        firstEtaMs
      );

      actionTaken = `📋 New plan saved with ${parsedPointers.length} pointers. First timer set for "${parsedPointers[0].title}" in ${parsedPointers[0].eta * 3600}s.`;
    }

    // Build the full prompt with context and action info
    let augmentedSystemPrompt = SYSTEM_PROMPT + contextMessage;
    if (actionTaken) {
      augmentedSystemPrompt += `\n\nACTION ALREADY TAKEN BY SYSTEM: ${actionTaken}\nAcknowledge this action naturally in your response.`;
    }

    const groq = new Groq({ apiKey });

    let formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    const messages = [
      { role: "system", content: augmentedSystemPrompt },
      ...formattedHistory,
      { role: "user", content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: "llama-3.1-8b-instant",
      max_tokens: 1500,
    });

    const text = chatCompletion.choices[0]?.message?.content || "";

    // Return response with metadata
    return NextResponse.json({
      text,
      actionTaken: actionTaken || null,
      dailyPlanStatus: dailyPlan?.status || null,
      completedCount: dailyPlan?.pointers.filter(p => p.status === 'done').length || 0,
      totalCount: dailyPlan?.pointers.length || 0,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error.message || error);
    return NextResponse.json(
      { error: "AI Service Error: " + (error.message || "Failed to get response") },
      { status: 500 }
    );
  }
}
