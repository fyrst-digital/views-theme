<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Account;

use Fyrst\ViewsTheme\Service\ComponentData;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Account:LoginRegister — the shared login / register tabs (register page and checkout register): which tab is active and the ids/slugs that wire tabs to panels.
 */
#[AsTwigComponent]
class LoginRegister
{
    public const TAB_PARAM = 'action';

    public mixed $page = null;

    public mixed $data = null;

    public mixed $formViolations = null;

    public bool $loginError = false;

    public ?string $errorSnippet = null;

    public mixed $waitTime = null;

    public string $redirectTo = 'frontend.account.home.page';

    public string $registerErrorRoute = 'frontend.account.register.page';

    public bool $guestSelectable = false;

    public mixed $redirectParameters = null;

    public string $tabParam = self::TAB_PARAM;

    public string $loginSlug = 'login';

    public string $registerSlug = 'register';

    public string $loginTabId = 'vi-account-tab-login';

    public string $registerTabId = 'vi-account-tab-register';

    public string $loginPanelId = 'vi-account-pane-login';

    public string $registerPanelId = 'vi-account-pane-register';

    /**
     * Register tab is active for a register round trip (violations / posted data) or `?{tabParam}=register`.
     */
    public bool $registerActive = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $this->formViolations = ComponentData::formViolations($this->formViolations, $request);

        $this->registerActive = $this->hasViolations($this->formViolations)
            || ComponentData::isFilled($this->data)
            || $request?->query->get($this->tabParam) === $this->registerSlug;
    }

    private function hasViolations(mixed $formViolations): bool
    {
        if (!\is_object($formViolations) || !method_exists($formViolations, 'getViolations')) {
            return false;
        }

        $violations = $formViolations->getViolations();

        return ($violations instanceof \Countable || \is_array($violations)) && \count($violations) > 0;
    }
}
