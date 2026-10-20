<?php
// Ответ гостя «Присоединиться к событию» → сообщение Марине в Telegram.
// Токен бота и chat_id лежат в rsvp-config.php рядом (файл не в git, см. rsvp-config.example.php).
// Совместим с PHP 5.6 (на хостинге сейчас 5.6) и новее.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('Europe/Moscow');

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') !== 'POST') respond(405, ['ok' => false, 'error' => 'method']);

$cfgFile = __DIR__ . '/rsvp-config.php';
if (!is_file($cfgFile)) respond(500, ['ok' => false, 'error' => 'config']);
$cfg = require $cfgFile;
if (empty($cfg['token']) || empty($cfg['chat_id'])) respond(500, ['ok' => false, 'error' => 'config']);

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) $in = $_POST;

// Ловушка для ботов: настоящий гость это поле не видит и не заполняет
if (!empty($in['website'])) respond(200, ['ok' => true]);

$name = trim(preg_replace('/\s+/u', ' ', (string)(isset($in['name']) ? $in['name'] : '')));
if ($name === '' || mb_strlen($name) > 60) respond(400, ['ok' => false, 'error' => 'name']);

// Не больше 5 отправок за 10 минут с одного адреса
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
$hitsFile = sys_get_temp_dir() . '/sims_rsvp_' . md5($ip);
$now = time();
$hits = [];
if (is_file($hitsFile)) {
    foreach (explode(',', (string)file_get_contents($hitsFile)) as $t) {
        if ((int)$t > $now - 600) $hits[] = (int)$t;
    }
}
if (count($hits) >= 5) respond(429, ['ok' => false, 'error' => 'rate']);
$hits[] = $now;
@file_put_contents($hitsFile, implode(',', $hits));

$answer = (isset($in['answer']) && $in['answer'] === 'no') ? 'no' : 'yes';
$text = ($answer === 'yes' ? "🎉 Придёт на вечеринку!" : "😔 Не сможет прийти")
      . "\n👤 " . $name . "\n🕒 " . date('d.m.Y H:i');

$ch = curl_init('https://api.telegram.org/bot' . $cfg['token'] . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query(['chat_id' => $cfg['chat_id'], 'text' => $text]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($res === false || $code !== 200) respond(502, ['ok' => false, 'error' => 'telegram']);

// Ссылку на чат гостей отдаём только тем, кто придёт (в коде страницы её нет)
$chat = ($answer === 'yes' && !empty($cfg['chat_url'])) ? $cfg['chat_url'] : null;
respond(200, ['ok' => true, 'chat' => $chat]);
