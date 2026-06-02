// Recommendation engine for generating personalized health guidance
// Based on prediction results and clinical parameters

export interface PredictionInput {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
}

export interface Recommendation {
  category: "diet" | "exercise" | "monitoring" | "lifestyle" | "medical";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionUrl?: string;
  icon: string;
}

export function generateRecommendations(
  input: PredictionInput,
  prediction: {
    prediction: string;
    probability: number;
    risk_level: string;
  }
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const isDiabetic = prediction.prediction === "Diabetic";
  const isHighRisk = prediction.probability >= 0.7;
  const isMediumRisk = prediction.probability >= 0.4 && prediction.probability < 0.7;

  // HIGH PRIORITY: Medical consultation
  if (isHighRisk || isDiabetic) {
    recommendations.push({
      category: "medical",
      priority: "high",
      title: "Consult Endocrinologist",
      message:
        "Schedule an appointment with an endocrinologist or primary care physician immediately for clinical diagnosis and treatment planning.",
      actionUrl: "/resources/find-doctor",
      icon: "Stethoscope",
    });
  }

  // Diet recommendations based on glucose
  if (input.Glucose > 125) {
    recommendations.push({
      category: "diet",
      priority: isHighRisk ? "high" : "medium",
      title: "Reduce Sugar Intake",
      message:
        "Limit refined carbohydrates and sugary foods. Focus on complex carbs with low glycemic index (whole grains, vegetables, legumes).",
      actionUrl: "/education/diet-guide",
      icon: "Apple",
    });

    recommendations.push({
      category: "diet",
      priority: "medium",
      title: "Increase Fiber Intake",
      message:
        "Aim for 25-30g of fiber daily from vegetables, fruits, and whole grains. Fiber helps regulate blood sugar levels.",
      actionUrl: "/education/diet-guide",
      icon: "Wheat",
    });
  } else {
    recommendations.push({
      category: "diet",
      priority: "low",
      title: "Maintain Balanced Diet",
      message:
        "Continue eating balanced meals with vegetables, lean proteins, and whole grains to maintain healthy glucose levels.",
      actionUrl: "/education/diet-guide",
      icon: "UtensilsCrossed",
    });
  }

  // BMI-based recommendations
  if (input.BMI > 30) {
    recommendations.push({
      category: "exercise",
      priority: "high",
      title: "Weight Management Critical",
      message:
        "Work with healthcare provider on safe weight loss plan. Even 5-7% body weight reduction can significantly lower diabetes risk.",
      actionUrl: "/calculators/bmi",
      icon: "Scale",
    });

    recommendations.push({
      category: "exercise",
      priority: "high",
      title: "Start Walking Program",
      message:
        "Begin with 10-15 minutes of walking daily, gradually increasing to 30 minutes. Low-impact exercise helps manage weight and improve insulin sensitivity.",
      actionUrl: "/education/exercise-guide",
      icon: "Footprints",
    });
  } else if (input.BMI > 25) {
    recommendations.push({
      category: "exercise",
      priority: "medium",
      title: "Maintain Healthy Weight",
      message:
        "Continue regular physical activity and monitor your BMI monthly. Aim for 150 minutes of moderate exercise per week.",
      actionUrl: "/calculators/bmi",
      icon: "Activity",
    });
  } else {
    recommendations.push({
      category: "exercise",
      priority: "low",
      title: "Stay Active",
      message:
        "Great job maintaining a healthy BMI! Continue regular physical activity to support overall metabolic health.",
      actionUrl: "/education/exercise-guide",
      icon: "Heart",
    });
  }

  // Blood pressure monitoring
  if (input.BloodPressure > 90 || input.BloodPressure < 60) {
    recommendations.push({
      category: "monitoring",
      priority: "high",
      title: "Monitor Blood Pressure",
      message:
        "Your blood pressure reading is outside normal range. Monitor it regularly and discuss with your healthcare provider.",
      actionUrl: "/calculators/daily-risk",
      icon: "HeartPulse",
    });
  }

  // Age-based recommendations
  if (input.Age > 45) {
    recommendations.push({
      category: "monitoring",
      priority: "medium",
      title: "Regular Screening Recommended",
      message:
        "Schedule diabetes screening (HbA1c, fasting glucose) every 3-6 months. Diabetes risk increases with age.",
      actionUrl: "/resources/screening",
      icon: "Calendar",
    });
  }

  // Family history (Pedigree function)
  if (input.DiabetesPedigreeFunction > 0.5) {
    recommendations.push({
      category: "monitoring",
      priority: "medium",
      title: "Strong Family History Detected",
      message:
        "Your diabetes pedigree function suggests elevated genetic risk. More frequent monitoring and preventive measures are important.",
      actionUrl: "/education/prevention",
      icon: "Users",
    });
  }

  // Lifestyle recommendations
  if (isHighRisk || isMediumRisk) {
    recommendations.push({
      category: "lifestyle",
      priority: "medium",
      title: "Stress Management",
      message:
        "Chronic stress can affect blood sugar levels. Practice relaxation techniques like meditation, yoga, or deep breathing exercises.",
      actionUrl: "/education/prevention",
      icon: "Brain",
    });

    recommendations.push({
      category: "lifestyle",
      priority: "medium",
      title: "Quality Sleep",
      message:
        "Aim for 7-8 hours of quality sleep nightly. Poor sleep affects insulin sensitivity and glucose regulation.",
      actionUrl: "/education/prevention",
      icon: "Moon",
    });
  }

  // Water intake
  if (isHighRisk) {
    recommendations.push({
      category: "lifestyle",
      priority: "low",
      title: "Stay Hydrated",
      message:
        "Drink 8-10 glasses of water daily. Proper hydration supports kidney function and helps regulate blood sugar.",
      actionUrl: "/calculators/daily-risk",
      icon: "Droplet",
    });
  }

  // Insulin monitoring
  if (input.Insulin > 200 || input.Insulin === 0) {
    recommendations.push({
      category: "monitoring",
      priority: "high",
      title: "Insulin Level Monitoring",
      message:
        "Your insulin reading is unusual. Discuss with healthcare provider about insulin resistance testing and management.",
      actionUrl: "/resources/find-doctor",
      icon: "Syringe",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top 8 recommendations
  return recommendations.slice(0, 8);
}

// Get quick action items based on risk level
export function getQuickActions(riskLevel: string): string[] {
  const actions: Record<string, string[]> = {
    "Very High": [
      "Schedule doctor appointment this week",
      "Start glucose monitoring log",
      "Review and adjust current diet",
      "Begin gentle daily exercise routine",
    ],
    High: [
      "Schedule doctor appointment within 2 weeks",
      "Track daily carbohydrate intake",
      "Start 30-minute daily walking program",
      "Monitor blood pressure regularly",
    ],
    Medium: [
      "Schedule preventive health screening",
      "Increase physical activity gradually",
      "Reduce processed food consumption",
      "Track weekly health metrics",
    ],
    Low: [
      "Maintain current healthy habits",
      "Annual health check-up recommended",
      "Continue balanced diet and exercise",
      "Self-monitor for any symptoms",
    ],
    "Very Low": [
      "Excellent! Keep up healthy lifestyle",
      "Annual screening for monitoring",
      "Share healthy habits with family",
      "Stay informed about prevention",
    ],
  };

  return actions[riskLevel] || actions["Medium"];
}
