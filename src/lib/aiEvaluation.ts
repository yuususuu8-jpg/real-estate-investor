// AI Property Evaluation Service
import { PropertyInput, CalculationResult } from './calculations';

export interface AIEvaluationInput {
  propertyInput: PropertyInput;
  calculationResult: CalculationResult;
  propertyName?: string;
  location?: string;
  propertyType?: 'apartment' | 'mansion' | 'house' | 'commercial' | 'other';
  buildingAge?: number;
  memo?: string;
}

export interface RiskFactor {
  category: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  score: number; // 1-10
}

export interface AIEvaluationResult {
  overallScore: number; // 1-100
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  profitabilityScore: number; // 1-100
  riskScore: number; // 1-100 (higher = more risky)
  cashFlowScore: number; // 1-100

  riskFactors: RiskFactor[];

  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  memoAnalysis?: string[]; // メモから分析した内容

  summary: string;
}

// 利回りの評価基準
const YIELD_THRESHOLDS = {
  excellent: 10,
  good: 7,
  fair: 5,
  poor: 3,
};

// CCRの評価基準
const CCR_THRESHOLDS = {
  excellent: 15,
  good: 10,
  fair: 5,
  poor: 0,
};

// 投資回収期間の評価基準（年）
const PAYBACK_THRESHOLDS = {
  excellent: 10,
  good: 15,
  fair: 20,
  poor: 25,
};

function evaluateYield(netYield: number): { score: number; rating: string } {
  if (netYield >= YIELD_THRESHOLDS.excellent) {
    return { score: 90, rating: '非常に高い利回り' };
  } else if (netYield >= YIELD_THRESHOLDS.good) {
    return { score: 75, rating: '良好な利回り' };
  } else if (netYield >= YIELD_THRESHOLDS.fair) {
    return { score: 55, rating: '標準的な利回り' };
  } else if (netYield >= YIELD_THRESHOLDS.poor) {
    return { score: 35, rating: '低めの利回り' };
  } else {
    return { score: 20, rating: '非常に低い利回り' };
  }
}

function evaluateCCR(ccr: number): { score: number; rating: string } {
  if (ccr >= CCR_THRESHOLDS.excellent) {
    return { score: 90, rating: '優秀な自己資金効率' };
  } else if (ccr >= CCR_THRESHOLDS.good) {
    return { score: 75, rating: '良好な自己資金効率' };
  } else if (ccr >= CCR_THRESHOLDS.fair) {
    return { score: 55, rating: '標準的な自己資金効率' };
  } else {
    return { score: 35, rating: '低い自己資金効率' };
  }
}

function evaluatePaybackPeriod(years: number): { score: number; rating: string } {
  if (years <= PAYBACK_THRESHOLDS.excellent) {
    return { score: 90, rating: '短期間での投資回収が見込める' };
  } else if (years <= PAYBACK_THRESHOLDS.good) {
    return { score: 70, rating: '妥当な投資回収期間' };
  } else if (years <= PAYBACK_THRESHOLDS.fair) {
    return { score: 50, rating: 'やや長い投資回収期間' };
  } else if (years <= PAYBACK_THRESHOLDS.poor) {
    return { score: 30, rating: '長期の投資回収が必要' };
  } else {
    return { score: 15, rating: '非常に長い投資回収期間' };
  }
}

function evaluateCashFlow(monthlyCashFlow: number, monthlyRent: number): { score: number; rating: string } {
  const ratio = monthlyCashFlow / monthlyRent;

  if (monthlyCashFlow < 0) {
    return { score: 10, rating: 'マイナスキャッシュフロー（持ち出し発生）' };
  } else if (ratio >= 0.3) {
    return { score: 90, rating: '非常に健全なキャッシュフロー' };
  } else if (ratio >= 0.2) {
    return { score: 75, rating: '良好なキャッシュフロー' };
  } else if (ratio >= 0.1) {
    return { score: 55, rating: '標準的なキャッシュフロー' };
  } else {
    return { score: 35, rating: '薄いキャッシュフロー' };
  }
}

function identifyRiskFactors(
  input: AIEvaluationInput
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  const { propertyInput, calculationResult, buildingAge } = input;

  // 空室リスク
  const vacancyRate = propertyInput.vacancyRate || 5;
  if (vacancyRate >= 15) {
    risks.push({
      category: '空室リスク',
      level: 'high',
      description: '空室率が高く設定されています。入居率の維持が課題となる可能性があります。',
      score: 8,
    });
  } else if (vacancyRate >= 10) {
    risks.push({
      category: '空室リスク',
      level: 'medium',
      description: '空室率がやや高めです。立地や物件の魅力向上を検討してください。',
      score: 5,
    });
  } else {
    risks.push({
      category: '空室リスク',
      level: 'low',
      description: '空室率は標準的な範囲内です。',
      score: 2,
    });
  }

  // キャッシュフローリスク
  if (calculationResult.monthlyCashFlow < 0) {
    risks.push({
      category: 'キャッシュフローリスク',
      level: 'high',
      description: 'マイナスキャッシュフローです。毎月の持ち出しが発生します。',
      score: 9,
    });
  } else if (calculationResult.monthlyCashFlow < calculationResult.annualRentIncome / 12 * 0.1) {
    risks.push({
      category: 'キャッシュフローリスク',
      level: 'medium',
      description: 'キャッシュフローが薄いため、予期せぬ出費に注意が必要です。',
      score: 5,
    });
  }

  // レバレッジリスク
  const loanRatio = (propertyInput.loanAmount || 0) / propertyInput.price;
  if (loanRatio > 0.9) {
    risks.push({
      category: 'レバレッジリスク',
      level: 'high',
      description: '借入比率が90%以上と非常に高く、金利上昇リスクが大きいです。',
      score: 8,
    });
  } else if (loanRatio > 0.7) {
    risks.push({
      category: 'レバレッジリスク',
      level: 'medium',
      description: '借入比率が70%以上です。金利変動に注意してください。',
      score: 5,
    });
  }

  // 築年数リスク
  if (buildingAge !== undefined) {
    if (buildingAge >= 30) {
      risks.push({
        category: '建物老朽化リスク',
        level: 'high',
        description: '築30年以上のため、大規模修繕や設備更新の費用が発生する可能性があります。',
        score: 7,
      });
    } else if (buildingAge >= 20) {
      risks.push({
        category: '建物老朽化リスク',
        level: 'medium',
        description: '築20年以上のため、中期的に修繕費用の増加が見込まれます。',
        score: 4,
      });
    }
  }

  // 投資回収リスク
  if (calculationResult.paybackPeriod > 25 || calculationResult.paybackPeriod === Infinity) {
    risks.push({
      category: '投資回収リスク',
      level: 'high',
      description: '投資回収に25年以上かかる見込みです。長期保有戦略が必要です。',
      score: 7,
    });
  }

  return risks;
}

function generateStrengths(
  input: AIEvaluationInput,
  yieldEval: { score: number },
  ccrEval: { score: number },
  paybackEval: { score: number },
  cashFlowEval: { score: number }
): string[] {
  const strengths: string[] = [];
  const { calculationResult } = input;

  if (calculationResult.netYield >= 8) {
    strengths.push(`実質利回り${calculationResult.netYield}%は市場平均を大きく上回る優秀な水準です`);
  } else if (calculationResult.netYield >= 6) {
    strengths.push(`実質利回り${calculationResult.netYield}%は良好な水準です`);
  }

  if (calculationResult.ccr >= 12) {
    strengths.push(`CCR${calculationResult.ccr}%は自己資金の運用効率が非常に高いことを示しています`);
  }

  if (calculationResult.monthlyCashFlow > 0 && cashFlowEval.score >= 70) {
    strengths.push(`月間${Math.round(calculationResult.monthlyCashFlow).toLocaleString()}円のプラスキャッシュフローが見込めます`);
  }

  if (calculationResult.paybackPeriod <= 12 && calculationResult.paybackPeriod > 0) {
    strengths.push(`投資回収期間が${calculationResult.paybackPeriod}年と比較的短期です`);
  }

  if (calculationResult.grossYield >= 10) {
    strengths.push(`表面利回り${calculationResult.grossYield}%は高い収益性を示しています`);
  }

  if (strengths.length === 0) {
    strengths.push('安定した賃貸経営が期待できる物件です');
  }

  return strengths;
}

function generateWeaknesses(
  input: AIEvaluationInput,
  riskFactors: RiskFactor[]
): string[] {
  const weaknesses: string[] = [];
  const { calculationResult, propertyInput } = input;

  const highRisks = riskFactors.filter(r => r.level === 'high');
  highRisks.forEach(risk => {
    weaknesses.push(risk.description);
  });

  if (calculationResult.netYield < 4) {
    weaknesses.push('実質利回りが4%未満と低く、収益性に課題があります');
  }

  if (calculationResult.annualExpenses / calculationResult.annualRentIncome > 0.4) {
    weaknesses.push('経費率が40%を超えており、収益を圧迫しています');
  }

  return weaknesses;
}

function generateRecommendations(
  input: AIEvaluationInput,
  riskFactors: RiskFactor[]
): string[] {
  const recommendations: string[] = [];
  const { calculationResult, propertyInput } = input;

  // 空室率に関する推奨
  if ((propertyInput.vacancyRate || 5) >= 10) {
    recommendations.push('家賃設定の見直しや物件の魅力向上（リノベーションなど）を検討してください');
  }

  // キャッシュフローに関する推奨
  if (calculationResult.monthlyCashFlow < 0) {
    recommendations.push('頭金を増やすか、より安価な物件を検討することでキャッシュフローを改善できます');
  }

  // レバレッジに関する推奨
  const loanRatio = (propertyInput.loanAmount || 0) / propertyInput.price;
  if (loanRatio > 0.8) {
    recommendations.push('借入比率を下げることで金利上昇リスクを軽減できます');
  }

  // 利回りに関する推奨
  if (calculationResult.netYield < 5) {
    recommendations.push('経費削減や家賃値上げの余地がないか検討してください');
  }

  // 一般的な推奨
  recommendations.push('購入前に現地確認と周辺相場の調査をお勧めします');
  recommendations.push('管理会社の選定は収益性に大きく影響するため慎重に行ってください');

  return recommendations;
}

// メモ内容を分析してポイントを抽出
function analyzeMemo(memo: string | undefined): { analysis: string[]; scoreAdjustment: number } {
  if (!memo || memo.trim() === '') {
    return { analysis: [], scoreAdjustment: 0 };
  }

  const analysis: string[] = [];
  let scoreAdjustment = 0;
  const memoLower = memo.toLowerCase();

  // ポジティブなキーワード
  const positiveKeywords: { keywords: string[]; message: string; adjustment: number }[] = [
    { keywords: ['駅近', '駅徒歩', '駅チカ', '徒歩5分', '徒歩3分'], message: '駅からのアクセスが良好な物件は入居需要が高い傾向があります', adjustment: 3 },
    { keywords: ['リフォーム済', 'リノベ', '改装済', '内装新'], message: 'リフォーム済み物件は入居率向上と賃料維持に有利です', adjustment: 2 },
    { keywords: ['大学', '学校', '学生'], message: '教育機関の近隣は学生需要が見込めます', adjustment: 2 },
    { keywords: ['管理組合', '管理良好', '修繕積立'], message: '管理体制が整っている物件は長期的な資産価値維持に有利です', adjustment: 2 },
    { keywords: ['角部屋', '南向き', '日当たり'], message: '日当たりや住環境の良さは入居者に好まれます', adjustment: 1 },
    { keywords: ['オートロック', 'セキュリティ', '防犯'], message: 'セキュリティ設備は入居者にとって安心材料です', adjustment: 1 },
    { keywords: ['商業施設', 'スーパー', 'コンビニ', '買い物'], message: '生活利便性の高い立地は入居需要を支えます', adjustment: 1 },
    { keywords: ['満室', '空室なし', '入居率高'], message: '現在の入居状況が良好なのはプラス材料です', adjustment: 3 },
    { keywords: ['新築', '築浅', '築3年', '築5年'], message: '築年数が浅い物件は修繕リスクが低い傾向があります', adjustment: 2 },
    { keywords: ['収益安定', '長期入居', '更新率'], message: '入居者の定着率が高いことは収益安定につながります', adjustment: 2 },
    // 修繕・工事完了系のポジティブキーワード
    { keywords: ['交換済', '交換を行い', '交換しており', '交換完了'], message: '設備の交換が完了しており、修繕リスクが軽減されています', adjustment: 3 },
    { keywords: ['防水工事', '屋上防水', '防水済', '防水を含め'], message: '防水工事済みで雨漏りリスクが低減されています', adjustment: 3 },
    { keywords: ['修繕済', '修繕完了', '修繕もしており', '修繕しており'], message: '修繕が完了しており、当面の大規模出費リスクが低いです', adjustment: 3 },
    { keywords: ['給水管', '排水管', '配管交換', '配管更新'], message: '配管系統のメンテナンスが行われています', adjustment: 2 },
    { keywords: ['外壁塗装', '外壁工事', '塗装済'], message: '外壁のメンテナンスが行われています', adjustment: 2 },
    { keywords: ['可能性は低い', '必要ない', '問題ない', '良好な状態'], message: '物件の状態が良好であることが示されています', adjustment: 2 },
    { keywords: ['耐震補強', '耐震工事', '新耐震'], message: '耐震性能が確保されています', adjustment: 2 },
  ];

  // ネガティブなキーワード（文脈を考慮）
  const negativeKeywords: { keywords: string[]; message: string; adjustment: number }[] = [
    { keywords: ['修繕が必要', '修繕予定', '要修繕', '修繕費用がかかる'], message: '近い将来修繕費用が発生する可能性があります', adjustment: -3 },
    { keywords: ['空室あり', '退去予定', '入居者募集中'], message: '空室状況を確認し、入居促進策を検討してください', adjustment: -2 },
    { keywords: ['事故物件', '告知事項'], message: '告知事項がある場合は賃料設定に影響する可能性があります', adjustment: -5 },
    { keywords: ['老朽化', '古い設備', '劣化'], message: '設備の老朽化は将来的な修繕コストに注意が必要です', adjustment: -2 },
    { keywords: ['騒音問題', '治安悪い', '環境悪い'], message: '周辺環境の懸念点は入居率に影響する可能性があります', adjustment: -2 },
    { keywords: ['人口減少', '過疎', '空き家多い'], message: 'エリアの人口動態は長期的な賃貸需要に影響します', adjustment: -3 },
    { keywords: ['再建築不可', '借地権', '旧耐震基準'], message: '物件の権利関係や建築基準に注意が必要です', adjustment: -3 },
    { keywords: ['競合多い', '供給過剰'], message: '周辺の賃貸供給状況を確認してください', adjustment: -2 },
    { keywords: ['雨漏り', '水漏れ', '漏水'], message: '水漏れ問題は早急な対応が必要です', adjustment: -4 },
    { keywords: ['シロアリ', '害虫', 'カビ'], message: '建物の劣化要因に注意が必要です', adjustment: -3 },
  ];

  // ポジティブキーワードのチェック
  positiveKeywords.forEach(({ keywords, message, adjustment }) => {
    if (keywords.some(kw => memo.includes(kw) || memoLower.includes(kw.toLowerCase()))) {
      analysis.push(`[プラス] ${message}`);
      scoreAdjustment += adjustment;
    }
  });

  // ネガティブキーワードのチェック
  negativeKeywords.forEach(({ keywords, message, adjustment }) => {
    if (keywords.some(kw => memo.includes(kw) || memoLower.includes(kw.toLowerCase()))) {
      analysis.push(`[注意] ${message}`);
      scoreAdjustment += adjustment;
    }
  });

  // メモがあるがキーワードが検出されなかった場合
  if (analysis.length === 0 && memo.length > 0) {
    analysis.push(`メモ内容: ${memo.substring(0, 100)}${memo.length > 100 ? '...' : ''}`);
  }

  // スコア調整の範囲を制限
  scoreAdjustment = Math.max(-15, Math.min(15, scoreAdjustment));

  return { analysis, scoreAdjustment };
}

function generateSummary(
  input: AIEvaluationInput,
  overallScore: number,
  overallRating: AIEvaluationResult['overallRating']
): string {
  const { calculationResult } = input;

  const ratingText = {
    excellent: '非常に優れた',
    good: '良好な',
    fair: '標準的な',
    poor: '課題のある',
  };

  let summary = `この物件は${ratingText[overallRating]}投資案件と評価されます。`;

  summary += `\n\n実質利回り${calculationResult.netYield}%、`;
  summary += `月間キャッシュフロー${calculationResult.monthlyCashFlow >= 0 ? '+' : ''}${Math.round(calculationResult.monthlyCashFlow).toLocaleString()}円、`;
  summary += `投資回収期間${calculationResult.paybackPeriod === Infinity ? '計算不可' : calculationResult.paybackPeriod + '年'}です。`;

  if (overallScore >= 70) {
    summary += '\n\n総合的に投資価値の高い物件と判断されます。リスク管理を徹底した上で、前向きに検討できる案件です。';
  } else if (overallScore >= 50) {
    summary += '\n\n一定の投資価値はありますが、いくつかの課題があります。改善策を検討した上で判断してください。';
  } else {
    summary += '\n\n現状では投資リスクが高い可能性があります。条件の見直しや他の物件との比較検討をお勧めします。';
  }

  return summary;
}

export function evaluateProperty(input: AIEvaluationInput): AIEvaluationResult {
  const { calculationResult, memo } = input;

  // 各指標の評価
  const yieldEval = evaluateYield(calculationResult.netYield);
  const ccrEval = evaluateCCR(calculationResult.ccr);
  const paybackEval = evaluatePaybackPeriod(calculationResult.paybackPeriod);
  const cashFlowEval = evaluateCashFlow(
    calculationResult.monthlyCashFlow,
    calculationResult.annualRentIncome / 12
  );

  // メモ分析
  const { analysis: memoAnalysis, scoreAdjustment } = analyzeMemo(memo);

  // スコア計算（重み付け）
  const profitabilityScore = Math.round(
    (yieldEval.score * 0.4 + ccrEval.score * 0.3 + paybackEval.score * 0.3)
  );

  const cashFlowScore = cashFlowEval.score;

  // リスク要因の特定
  const riskFactors = identifyRiskFactors(input);
  const avgRiskScore = riskFactors.length > 0
    ? Math.round(riskFactors.reduce((sum, r) => sum + r.score, 0) / riskFactors.length * 10)
    : 30;
  const riskScore = Math.min(100, avgRiskScore);

  // 総合スコア（メモからの調整を反映）
  let overallScore = Math.round(
    profitabilityScore * 0.4 +
    cashFlowScore * 0.3 +
    (100 - riskScore) * 0.3
  ) + scoreAdjustment;

  // スコアを0-100の範囲に収める
  overallScore = Math.max(0, Math.min(100, overallScore));

  // 総合評価
  let overallRating: AIEvaluationResult['overallRating'];
  if (overallScore >= 75) {
    overallRating = 'excellent';
  } else if (overallScore >= 55) {
    overallRating = 'good';
  } else if (overallScore >= 40) {
    overallRating = 'fair';
  } else {
    overallRating = 'poor';
  }

  // 強み・弱み・推奨事項
  const strengths = generateStrengths(input, yieldEval, ccrEval, paybackEval, cashFlowEval);
  const weaknesses = generateWeaknesses(input, riskFactors);
  const recommendations = generateRecommendations(input, riskFactors);
  const summary = generateSummary(input, overallScore, overallRating);

  return {
    overallScore,
    overallRating,
    profitabilityScore,
    riskScore,
    cashFlowScore,
    riskFactors,
    strengths,
    weaknesses,
    recommendations,
    memoAnalysis: memoAnalysis.length > 0 ? memoAnalysis : undefined,
    summary,
  };
}
