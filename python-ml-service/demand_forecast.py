import pandas as pd
from prophet import Prophet
import datetime

def forecast_demand(data):
    # data["history"] now comes from our real Supabase shipment records
    df = pd.DataFrame(data["history"])
    
    if df.empty:
        return {"error": "No historical data found"}

    df.columns = ["ds", "y"]
    
    # Train Prophet
    model = Prophet(daily_seasonality=True, yearly_seasonality=False)
    model.fit(df)
    
    # Predict next 30 days
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)
    
    # Calculate Forecasted Totals
    next_30_days = forecast['yhat'].tail(30).clip(lower=0) # No negative sales
    
    chart_data = forecast[['ds', 'yhat']].tail(45).copy() # Last 15 days + next 30
    chart_data['ds'] = chart_data['ds'].dt.strftime('%Y-%m-%d')
    chart_data['yhat'] = chart_data['yhat'].round(0).clip(lower=0)

    return {
        "chart_data": chart_data.to_dict(orient="records"),
        "next_month_total": int(next_30_days.sum()),
        "daily_avg": float(next_30_days.mean())
    }