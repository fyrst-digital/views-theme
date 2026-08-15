<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Account;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Account:Register — guest/password/email gates; Twig composes fields.
 */
#[AsTwigComponent]
class Register
{
    public mixed $data = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public bool $guestSelectable = false;

    public ?string $redirectTo = null;

    public mixed $redirectParameters = null;

    public ?string $errorRoute = null;

    public mixed $errorParameters = null;

    public ?string $cardTitle = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public mixed $salutations = null;

    public mixed $countries = null;

    public mixed $billingAddress = null;

    public mixed $shippingAddress = null;

    public mixed $accountType = null;

    public mixed $shippingAccountType = null;

    public bool $guestChecked = false;

    public bool $differentShipping = false;

    public bool $requireEmailConfirmation = false;

    public bool $requirePasswordConfirmation = false;

    public int $passwordMinLength = 0;

    public string $passwordDescription = '';

    public bool $showBirthdayField = false;

    public ?string $email = null;

    public ?string $emailConfirmation = null;

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();

        $this->redirectTo ??= $this->guestSelectable ? 'frontend.checkout.confirm.page' : 'frontend.account.home.page';
        $this->errorRoute ??= $this->guestSelectable ? 'frontend.checkout.register.page' : 'frontend.account.register.page';

        $this->requireEmailConfirmation = (bool) $this->systemConfigService->get('core.loginRegistration.requireEmailConfirmation', $salesChannelId);
        $this->requirePasswordConfirmation = (bool) $this->systemConfigService->get('core.loginRegistration.requirePasswordConfirmation', $salesChannelId);
        $minLength = $this->systemConfigService->get('core.loginRegistration.passwordMinLength', $salesChannelId);
        $this->passwordMinLength = is_numeric($minLength) ? (int) $minLength : 0;
        $this->passwordDescription = $this->passwordMinLength > 0
            ? $this->translator->trans('account.personalPasswordDescription', ['%minLength%' => $this->passwordMinLength])
            : '';
        $this->showBirthdayField = (bool) $this->systemConfigService->get('core.loginRegistration.showBirthdayField', $salesChannelId);

        $createDefault = (int) $this->systemConfigService->get('core.loginRegistration.createCustomerAccountDefault', $salesChannelId) === 1;
        $createFromData = $this->bagValue($this->data, 'createCustomerAccount');
        $this->guestChecked = $createFromData !== null
            ? (bool) $createFromData
            : $createDefault;

        $this->differentShipping = (bool) $this->bagValue($this->data, 'differentShippingAddress');
        $this->email = $this->scalar($this->bagValue($this->data, 'email'));
        $this->emailConfirmation = $this->scalar($this->bagValue($this->data, 'emailConfirmation'));
        $this->accountType = $this->bagValue($this->data, 'accountType');
        $this->billingAddress = $this->bagValue($this->data, 'billingAddress') ?? $this->data;
        $this->shippingAddress = $this->bagValue($this->data, 'shippingAddress');
        $this->shippingAccountType = $this->bagValue($this->shippingAddress, 'accountType');

        if ($this->salutations === null && \is_object($this->page) && method_exists($this->page, 'getSalutations')) {
            $this->salutations = $this->page->getSalutations();
        }
        if ($this->countries === null && \is_object($this->page) && method_exists($this->page, 'getCountries')) {
            $this->countries = $this->page->getCountries();
        }
    }

    private function bagValue(mixed $data, string $key): mixed
    {
        if ($data === null) {
            return null;
        }

        if (\is_object($data) && method_exists($data, 'get')) {
            try {
                return $data->get($key);
            } catch (\Throwable) {
            }
        }

        if (\is_object($data)) {
            $method = 'get' . ucfirst($key);
            if (method_exists($data, $method)) {
                return $data->{$method}();
            }
        }

        if (\is_array($data)) {
            return $data[$key] ?? null;
        }

        return null;
    }

    private function scalar(mixed $value): ?string
    {
        if (!\is_string($value) && !is_numeric($value)) {
            return null;
        }

        $string = (string) $value;

        return $string !== '' ? $string : null;
    }
}
