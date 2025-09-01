/**
 * タイムスタンプを相対時間に変換
 * @param timestamp ISO 8601形式のタイムスタンプ文字列
 * @returns 相対時間文字列 (例: "2.5h", "30s")
 */
export function toRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const duration = (Date.now() - date.getTime()) / 1000; // 秒単位
    
    // 未来の時刻の場合
    if (duration < 0) {
      const absDuration = Math.abs(duration);
      const { value } = getTimeUnit(absDuration);
      return `-${value}`;
    }
    
    const { value } = getTimeUnit(duration);
    return value;
  } catch {
    return '';
  }
}

function getTimeUnit(duration: number): { unit: string; value: string } {
  const years = Math.floor(duration / (365 * 24 * 60 * 60));
  const days = Math.floor(duration / (24 * 60 * 60));
  const hours = Math.floor(duration / (60 * 60));
  const minutes = Math.floor(duration / 60);
  const seconds = duration;
  
  // 365日以上は年と日
  if (days >= 365) {
    const remainingDays = days % 365;
    return { unit: '', value: `${years}y${remainingDays}d` };
  }
  
  // 1日以上は日と時間
  if (days >= 1) {
    const remainingHours = Math.floor((duration % (24 * 60 * 60)) / (60 * 60));
    return { unit: '', value: `${days}d${remainingHours}h` };
  }
  
  // 1時間以上は時間と分
  if (hours >= 1) {
    const remainingMinutes = Math.floor((duration % (60 * 60)) / 60);
    return { unit: '', value: `${hours}h${remainingMinutes}m` };
  }
  
  // 1分以上は分と秒
  if (minutes >= 1) {
    const remainingSeconds = Math.floor(duration % 60);
    return { unit: '', value: `${minutes}m${remainingSeconds}s` };
  }
  
  // 1分未満は秒表示（小数点第1位まで、常に.0を表示）
  const roundedSeconds = Math.floor(seconds * 10) / 10;
  return { unit: '', value: `${roundedSeconds.toFixed(1)}s` };
}