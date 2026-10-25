<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\Salutation\SalutationEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Salutation — salutation select from the page collection.
 */
#[AsTwigComponent]
class Salutation
{
    public mixed $data = null;

    public mixed $salutations = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    /**
     * @var list<array{value: string, label: string, selected?: bool}>
     */
    public array $options = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string}
     */
    public array $field = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
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
        $this->visible = (bool) $this->systemConfigService->get('core.loginRegistration.showSalutation', $salesChannelId);
        $this->salutations ??= ComponentData::pageSalutations($this->page);
        $this->options = $this->buildOptions();
        $this->field = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            'personalSalutation',
            'salutationId',
            ComponentData::get($this->data, 'salutationId'),
        );
    }

    /**
     * @return list<array{value: string, label: string, selected?: bool}>
     */
    private function buildOptions(): array
    {
        $options = [];
        if (!\is_iterable($this->salutations)) {
            return $options;
        }

        $selected = ComponentData::get($this->data, 'salutationId');
        foreach ($this->salutations as $salutation) {
            if (!$salutation instanceof SalutationEntity) {
                continue;
            }
            $id = $salutation->getId();
            $label = (string) ($salutation->getTranslation('displayName') ?? $salutation->getDisplayName() ?? $salutation->getTranslation('name') ?? $id);
            $options[] = [
                'value' => $id,
                'label' => $label,
                'selected' => $selected !== null && (string) $selected === $id,
            ];
        }

        return $options;
    }
}
