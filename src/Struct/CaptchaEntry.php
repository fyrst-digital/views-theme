<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

/**
 * One active captcha for Captcha.
 *
 * `component` is the UX tag for `component()`. `slot` is the Captcha CVA / attrs slot,
 * `visible` is false for captchas that render nothing the shopper can see (honeypot).
 */
final readonly class CaptchaEntry
{
    /**
     * @param array<string, mixed> $props
     */
    public function __construct(
        public string $type,
        public string $component,
        public string $slot,
        public array $props = [],
        public bool $visible = true,
    ) {
    }
}
