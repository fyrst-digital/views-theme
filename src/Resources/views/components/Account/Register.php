<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Account;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Account:Register — guest password gate; Twig composes fields.
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

    public ?string $requestedGroupId = null;

    public bool $onlyCompanyRegistration = false;

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

    public bool $createAccountChecked = false;

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
        private readonly RequestStack $requestStack,
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
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );

        $createDefault = (int) $this->systemConfigService->get('core.loginRegistration.createCustomerAccountDefault', $salesChannelId) === 1;
        $createFromData = ComponentData::get($this->data, 'createCustomerAccount');
        if (!$this->guestSelectable) {
            $this->createAccountChecked = true;
        } elseif ($createFromData !== null) {
            $this->createAccountChecked = ComponentData::getBoolean($this->data, 'createCustomerAccount');
        } elseif (ComponentData::isFilled($this->data)) {
            $this->createAccountChecked = false;
        } else {
            $this->createAccountChecked = $createDefault;
        }

        $this->differentShipping = (bool) ComponentData::get($this->data, 'differentShippingAddress');
        $this->email = ComponentData::scalar(ComponentData::get($this->data, 'email'));
        $this->emailConfirmation = ComponentData::scalar(ComponentData::get($this->data, 'emailConfirmation'));
        $this->accountType = ComponentData::get($this->data, 'accountType');
        $this->billingAddress = ComponentData::get($this->data, 'billingAddress') ?? $this->data;
        $this->shippingAddress = ComponentData::get($this->data, 'shippingAddress');
        $this->shippingAccountType = ComponentData::get($this->shippingAddress, 'accountType');

        $this->salutations ??= ComponentData::pageSalutations($this->page);
        $this->countries ??= ComponentData::pageCountries($this->page);
    }
}
