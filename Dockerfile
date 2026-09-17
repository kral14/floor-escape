FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 🛑 BUILD MƏRHƏLƏSİNDƏ POSTGRESQL YOXLANIŞI (Qoşulma yoxdursa build dayanır!)
RUN python check_db_build.py

RUN mkdir -p /app/data

EXPOSE 4000 4001 8082

CMD ["python", "server.py"]
