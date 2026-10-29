<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Struct\CaptchaEntry;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Captcha — resolves the active Shopware captchas; Twig only mounts one child per type.
 */
#[AsTwigComponent]
class Captcha
{
    public const CONFIG_KEY = 'core.basicInformation.activeCaptchasV2';

    private const BASIC = 'basicCaptcha';

    private const HONEYPOT = 'honeypot';

    private const GOOGLE_V2 = 'googleReCaptchaV2';

    private const GOOGLE_V3 = 'googleReCaptchaV3';

    public ?string $formId = null;

    /**
     * Form id the core captcha plugins and the server validation key off (`form-{formId}`).
     */
    public string $captchaFormId = '';

    /**
     * Active captchas in config order.
     *
     * @var list<CaptchaEntry>
     */
    public array $captchas = [];

    /**
     * True when no active captcha renders anything the shopper can see (honeypot only, or none).
     */
    public bool $hidden = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();

        $this->formId ??= (string) random_int(100_000, 2_147_483_647);
        $this->captchaFormId = 'form-' . $this->formId;

        $active = [];
        $configured = $this->systemConfigService->get(self::CONFIG_KEY, $salesChannelId);
        if (\is_array($configured)) {
            foreach ($configured as $type => $captcha) {
                if (\is_array($captcha) && ($captcha['isActive'] ?? false)) {
                    $active[(string) $type] = $captcha;
                }
            }
        }

        $this->captchas = [];
        foreach ($active as $type => $captcha) {
            $this->captchas[] = $this->entry($type, $captcha, isset($active[self::GOOGLE_V3]));
        }

        $this->hidden = array_filter($this->captchas, static fn (CaptchaEntry $entry): bool => $entry->visible) === [];
    }

    /**
     * @param array<string, mixed> $captcha
     */
    private function entry(string $type, array $captcha, bool $googleV3Active): CaptchaEntry
    {
        $config = \is_array($captcha['config'] ?? null) ? $captcha['config'] : [];
        $siteKey = $config['siteKey'] ?? null;

        return match ($type) {
            self::BASIC => new CaptchaEntry($type, 'ViewsTheme:Captcha:Basic', $type, [
                'formId' => $this->captchaFormId,
            ]),
            self::HONEYPOT => new CaptchaEntry($type, 'ViewsTheme:Captcha:Honeypot', $type, visible: false),
            self::GOOGLE_V2 => new CaptchaEntry($type, 'ViewsTheme:Captcha:GoogleReCaptchaV2', $type, [
                'formId' => $this->captchaFormId,
                'siteKey' => $siteKey,
                'invisible' => (bool) ($config['invisible'] ?? false),
                'protection' => (bool) ($config['invisible'] ?? false) && !$googleV3Active,
            ]),
            self::GOOGLE_V3 => new CaptchaEntry($type, 'ViewsTheme:Captcha:GoogleReCaptchaV3', $type, [
                'formId' => $this->captchaFormId,
                'siteKey' => $siteKey,
            ]),
            default => new CaptchaEntry($type, 'ViewsTheme:Captcha:Legacy', 'legacy', [
                'type' => $type,
                'formId' => $this->captchaFormId,
            ]),
        };
    }
}
