from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from prophet import Prophet
import datetime
import requests
import os
from dotenv import load_dotenv

# load environment variables from a .env file in the project root
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ForecastInput(BaseModel):
    history: list

class PredictionInput(BaseModel):
    weather: str
    distance: float
    historical_delay: float

class WeatherInput(BaseModel):
    lat: float
    lng: float

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    messages: list[ChatMessage]

@app.post("/predict-demand")
async def predict_demand(data: ForecastInput):
    try:
        if not data.history or len(data.history) < 3:
            baseline = []
            base_date = datetime.date.today()
            for i in range(30):
                future_date = base_date + datetime.timedelta(days=i)
                baseline.append({"ds": future_date.strftime('%Y-%m-%d'), "yhat": 15.0 + (i * 0.1)})
            return {"chart_data": baseline, "daily_avg": 16.5, "next_month_total": 495, "status": "baseline"}

        df = pd.DataFrame(data.history)
        df.columns = ["ds", "y"]
        df['ds'] = pd.to_datetime(df['ds'])
        m = Prophet(daily_seasonality=True, yearly_seasonality=False)
        m.fit(df)
        future = m.make_future_dataframe(periods=30)
        forecast = m.predict(future)
        next_30_days = forecast['yhat'].tail(30).clip(lower=0)
        chart_data = forecast[['ds', 'yhat']].tail(45).copy()
        chart_data['ds'] = chart_data['ds'].dt.strftime('%Y-%m-%d')
        chart_data['yhat'] = chart_data['yhat'].round(0).clip(lower=0)
        return {"chart_data": chart_data.to_dict(orient="records"), "next_month_total": int(next_30_days.sum()), "daily_avg": float(next_30_days.mean()), "status": "ai"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-delay")
async def predict_delay(data: PredictionInput):
    weather_risk = {"Clear": 1.0, "Rain": 1.5, "Storm": 3.0, "Fog": 2.0, "Snow": 2.5}
    multiplier = weather_risk.get(data.weather, 1.0)
    base_calc = (data.distance * 0.02) + (data.historical_delay * 10)
    prediction = min(0.98, (base_calc * multiplier) / 100)
    return {"delay_probability": round(prediction, 2)}

@app.post("/check-weather-risk")
async def check_weather_risk(data: WeatherInput):
    # API key fetched from environment; create a `.env` file with
    # `API_KEY=your_key_here` or set the variable in the shell before
    # starting the service.
    API_KEY = os.getenv("API_KEY")
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={data.lat}&lon={data.lng}&appid={API_KEY}"
    print(API_KEY)
    print(data)
    try:
        res = requests.get(url).json()
        weather_id = res['weather'][0]['id']
        condition = res['weather'][0]['main']
        is_severe = (200 <= weather_id <= 299) or (500 <= weather_id <= 599) or condition.lower() in ["cyclone", "storm"]
        return {
            "condition": condition,
            "alert": f"⚠️ SEVERE WEATHER: {condition.upper()}" if is_severe else f"✅ Clear ({condition})",
            "risk_multiplier": 3.5 if is_severe else 1.0
        }
    except:
        return {"condition": "Unknown", "alert": "✅ Weather Clear", "risk_multiplier": 1.0}
@app.post("/chat")
async def chat_endpoint(data: ChatInput):
    # wrapper sending conversation to OpenAI (requires OPENAI_API_KEY env var)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"reply": "(no API key provided)"}
    try:
        import openai
        openai.api_key = api_key
        messages = [{"role": m.role, "content": m.content} for m in data.messages]
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages
        )
        text = resp.choices[0].message.get("content", "")
        return {"reply": text}
    except Exception as e:
        print("chat error", e)
        return {"reply": "(error contacting AI)"}
