<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:AccountType — private/business select and company disclosure.
 */
#[AsTwigComponent]
class AccountType
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public mixed $accountType = null;

    public bool $hideCustomerTypeSelect = false;

    public bool $onlyCompanyRegistration = false;

    public bool $showVat = true;

    public bool $showCompanyFields = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showAccountType = false;

    public bool $showCompany = false;

    public bool $companyAlways = false;

    public string $businessType = CustomerEntity::ACCOUNT_TYPE_BUSINESS;

    public string $accountTypeValue = CustomerEntity::ACCOUNT_TYPE_PRIVATE;

    /**
     * @var list<array{value: string, label: string, selected?: bool, disabled?: bool}>
     */
    public array $options = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string}
     */
    public array $field = [];

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
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );
        $showAccountTypeConfig = (bool) $this->systemConfigService->get('core.loginRegistration.showAccountTypeSelection', $salesChannelId);

        $this->showAccountType = !$this->hideCustomerTypeSelect && ($showAccountTypeConfig || $this->onlyCompanyRegistration);
        $this->companyAlways = $this->onlyCompanyRegistration;
        $this->showCompany = $this->showAccountType || $this->companyAlways || $this->showCompanyFields;

        $resolvedType = $this->resolveAccountType();
        $this->accountTypeValue = $resolvedType;
        $this->options = $this->showAccountType ? $this->buildAccountTypeOptions($resolvedType) : [];
        $this->field = ComponentData::field($this->idPrefix, $this->prefix, 'accountType', 'accountType', $this->accountTypeValue);
    }

    private function resolveAccountType(): string
    {
        if ($this->onlyCompanyRegistration) {
            return CustomerEntity::ACCOUNT_TYPE_BUSINESS;
        }

        $fromProp = \is_string($this->accountType) ? $this->accountType : null;
        $fromData = ComponentData::get($this->data, 'accountType');
        $company = ComponentData::get($this->data, 'company');

        if ($fromProp === CustomerEntity::ACCOUNT_TYPE_BUSINESS || $fromData === CustomerEntity::ACCOUNT_TYPE_BUSINESS || ComponentData::scalar($company) !== null) {
            return CustomerEntity::ACCOUNT_TYPE_BUSINESS;
        }

        if (\is_string($fromProp) && $fromProp !== '') {
            return $fromProp;
        }

        if (\is_string($fromData) && $fromData !== '') {
            return $fromData;
        }

        return CustomerEntity::ACCOUNT_TYPE_PRIVATE;
    }

    /**
     * @return list<array{value: string, label: string, selected?: bool, disabled?: bool}>
     */
    private function buildAccountTypeOptions(string $selected): array
    {
        $options = [];
        if (!$this->onlyCompanyRegistration) {
            $options[] = [
                'value' => CustomerEntity::ACCOUNT_TYPE_PRIVATE,
                'label' => $this->translator->trans('account.personalTypePrivate'),
                'selected' => $selected === CustomerEntity::ACCOUNT_TYPE_PRIVATE,
            ];
        }

        $options[] = [
            'value' => CustomerEntity::ACCOUNT_TYPE_BUSINESS,
            'label' => $this->translator->trans('account.personalTypeBusiness'),
            'selected' => $selected === CustomerEntity::ACCOUNT_TYPE_BUSINESS,
        ];

        return $options;
    }
}
