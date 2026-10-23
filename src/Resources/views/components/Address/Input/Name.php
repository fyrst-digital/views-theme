<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Name — first and last name fields.
 */
#[AsTwigComponent]
class Name
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string}
     */
    public array $firstName = [];

    /**
     * @var array{id: string, name: string, value: mixed, violationPath: string}
     */
    public array $lastName = [];

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
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );
        $this->firstName = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            '-personalFirstName',
            'firstName',
            ComponentData::get($this->data, 'firstName'),
        );
        $this->lastName = ComponentData::field(
            $this->idPrefix,
            $this->prefix,
            '-personalLastName',
            'lastName',
            ComponentData::get($this->data, 'lastName'),
        );
    }
}
