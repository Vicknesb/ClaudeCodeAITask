export interface Temperature {
  celsius: number;
  fahrenheit: number;
}

export interface WeatherData {
  city: string;
  temperature: Temperature;
  condition: string;
  humidity: number;
  windKph: number;
}

export interface ForecastDay {
  date: string;
  temperature: Temperature;
  condition: string;
  humidity: number;
  windKph: number;
}

export interface ForecastResponse {
  city: string;
  forecast: ForecastDay[];
}

export interface HealthResponse {
  status: "ok";
}
