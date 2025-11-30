// 都道府県データと概算税率
// 固定資産税率は標準1.4%、都市計画税は最大0.3%
// 土地評価額は時価の約70%が目安
// 建物評価額は築年数による減価償却を考慮し、平均的な投資物件（築10-20年）で35%程度

export interface Prefecture {
  code: string;
  name: string;
  // 固定資産税率（標準1.4%）
  propertyTaxRate: number;
  // 都市計画税率（0〜0.3%）
  cityPlanningTaxRate: number;
  // 土地評価額の係数（時価に対する割合）
  landAssessmentRatio: number;
  // 建物評価額の係数（時価に対する割合）
  buildingAssessmentRatio: number;
  // 火災保険の概算係数（建物価格に対する年間保険料率）
  fireInsuranceRate: number;
}

// 都道府県別データ
// 実際の税率は市区町村により異なるため、概算値として使用
export const PREFECTURES: Prefecture[] = [
  // 北海道・東北
  { code: '01', name: '北海道', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '02', name: '青森県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '03', name: '岩手県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '04', name: '宮城県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '05', name: '秋田県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '06', name: '山形県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '07', name: '福島県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },

  // 関東
  { code: '08', name: '茨城県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '09', name: '栃木県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '10', name: '群馬県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '11', name: '埼玉県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '12', name: '千葉県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '13', name: '東京都', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '14', name: '神奈川県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },

  // 中部
  { code: '15', name: '新潟県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '16', name: '富山県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '17', name: '石川県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '18', name: '福井県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '19', name: '山梨県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '20', name: '長野県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '21', name: '岐阜県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '22', name: '静岡県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '23', name: '愛知県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },

  // 近畿
  { code: '24', name: '三重県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '25', name: '滋賀県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '26', name: '京都府', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '27', name: '大阪府', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '28', name: '兵庫県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '29', name: '奈良県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '30', name: '和歌山県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },

  // 中国
  { code: '31', name: '鳥取県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '32', name: '島根県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '33', name: '岡山県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '34', name: '広島県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '35', name: '山口県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },

  // 四国
  { code: '36', name: '徳島県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '37', name: '香川県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '38', name: '愛媛県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '39', name: '高知県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0018 },

  // 九州・沖縄
  { code: '40', name: '福岡県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '41', name: '佐賀県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '42', name: '長崎県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '43', name: '熊本県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0013 },
  { code: '44', name: '大分県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0012 },
  { code: '45', name: '宮崎県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0015 },
  { code: '46', name: '鹿児島県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0018 },
  { code: '47', name: '沖縄県', propertyTaxRate: 0.014, cityPlanningTaxRate: 0.003, landAssessmentRatio: 0.7, buildingAssessmentRatio: 0.35, fireInsuranceRate: 0.0020 },
];

// 経費自動計算の結果型
export interface ExpenseEstimate {
  propertyTax: number;      // 固定資産税（年額）
  cityPlanningTax: number;  // 都市計画税（年額）
  totalTax: number;         // 合計税金（年額）
  fireInsurance: number;    // 火災保険（年額）
}

/**
 * 物件価格と都道府県から経費を概算計算
 * @param priceInYen 物件価格（円）
 * @param prefecture 都道府県データ
 * @param landRatio 土地の割合（0-1、デフォルト0.4 = 土地40%、建物60%）
 * @returns 概算経費
 */
export function estimateExpenses(
  priceInYen: number,
  prefecture: Prefecture,
  landRatio: number = 0.4
): ExpenseEstimate {
  const landPrice = priceInYen * landRatio;
  const buildingPrice = priceInYen * (1 - landRatio);

  // 土地の評価額と税額
  const landAssessedValue = landPrice * prefecture.landAssessmentRatio;
  const landPropertyTax = landAssessedValue * prefecture.propertyTaxRate;
  const landCityPlanningTax = landAssessedValue * prefecture.cityPlanningTaxRate;

  // 建物の評価額と税額
  const buildingAssessedValue = buildingPrice * prefecture.buildingAssessmentRatio;
  const buildingPropertyTax = buildingAssessedValue * prefecture.propertyTaxRate;
  const buildingCityPlanningTax = buildingAssessedValue * prefecture.cityPlanningTaxRate;

  // 合計
  const propertyTax = Math.round(landPropertyTax + buildingPropertyTax);
  const cityPlanningTax = Math.round(landCityPlanningTax + buildingCityPlanningTax);
  const totalTax = propertyTax + cityPlanningTax;

  // 火災保険（建物価格ベース）
  const fireInsurance = Math.round(buildingPrice * prefecture.fireInsuranceRate);

  return {
    propertyTax,
    cityPlanningTax,
    totalTax,
    fireInsurance,
  };
}
