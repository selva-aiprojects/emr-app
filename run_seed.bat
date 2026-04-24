@echo off
cd /d "d:\Training\working\EMR-Application"
node server/seed_nah_data.js --seed
echo Seeding completed
