# Lumina OH Language Policy

Project primary language: Japanese (ja-JP)

This rule applies to the entire product.

## Core Rule

All user interface text must be written in Japanese.

This includes:

- buttons
- menu items
- navigation labels
- error messages
- onboarding text
- form labels
- notifications
- modal dialogs
- reports UI titles

Chinese or English must NOT appear in the UI.

## Developer Interaction Exception

Developers may write prompts in Chinese or English.

However:

The generated UI must always remain Japanese.

## UI Language Standard

Use natural Japanese suitable for Japanese female users.

Tone:

- calm
- gentle
- reflective
- spiritual
- minimal

Avoid machine translation tone.

## Example

Correct:

開始する  
カードを選ぶ  
今日のテーマ  
心の洞察  
エネルギー分析  

Incorrect:

開始  
抽卡  
能量分析  
Energy Report  

## System Messages

Example style:

分析レポートを生成しています…

無料登録すると  
あなたの心の洞察レポートを見ることができます

## Report Sections

AI analysis reports must also be Japanese.

Example sections:

今日のテーマ  
カードのメッセージ  
心理洞察  
五行エネルギー分析  
今日のリフレクション  
小さな行動提案

## Enforcement Rule

If any UI text is generated in Chinese or English, replace it with Japanese automatically.

Do not change UI language based on developer prompt language.

The UI language must always remain Japanese.

## Locale

Locale standard:

ja-JP