export interface FitbitProfileResponse {
  user: {
    age: number;
    avatar: string;
    displayName: string;
    encodedId: string;
    fullName: string;
    gender: string;
    height: number;
    heightUnit: string;
    locale: string;
    timezone: string;
    weight: number;
    weightUnit: string;
  };
}

export interface FitbitActivityResponse {
  activities: Array<{
    activityId: number;
    activityParentId: number;
    activityParentName: string;
    activityName: string;
    calories: number;
    duration: number;
    distance: number;
    steps?: number;
  }>;
  goals: {
    activeMinutes: number;
    caloriesOut: number;
    distance: number;
    floors: number;
    steps: number;
  };
  summary: {
    activeScore: number;
    activityCalories: number;
    caloriesBMR: number;
    caloriesOut: number;
    distances: Array<{ activity: string; distance: number }>;
    elevation: number;
    fairlyActiveMinutes: number;
    floors: number;
    lightlyActiveMinutes: number;
    marginalCalories: number;
    restingHeartRate?: number;
    sedentaryMinutes: number;
    steps: number;
    veryActiveMinutes: number;
  };
}

export interface FitbitTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  user_id: string;
}

export interface FitbitErrorResponse {
  errors?: Array<{ errorType: string; message: string }>;
  success?: boolean;
}
