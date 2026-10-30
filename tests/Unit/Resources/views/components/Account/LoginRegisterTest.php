<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Account;

use Fyrst\ViewsTheme\Resources\views\components\Account\LoginRegister;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

final class LoginRegisterTest extends TestCase
{
    #[DataProvider('registerActiveProvider')]
    public function testRegisterActive(Request $request, mixed $data, mixed $formViolations, bool $expected): void
    {
        $component = $this->createComponent($request);
        $component->data = $data;
        $component->formViolations = $formViolations;
        $component->postMount([]);

        self::assertSame($expected, $component->registerActive);
    }

    /**
     * @return iterable<string, array{0: Request, 1: mixed, 2: mixed, 3: bool}>
     */
    public static function registerActiveProvider(): iterable
    {
        yield 'default is login' => [new Request(), null, null, false];
        yield 'empty posted bag' => [new Request(), new DataBag(), null, false];
        yield 'param register' => [new Request(['action' => 'register']), null, null, true];
        yield 'param login' => [new Request(['action' => 'login']), null, null, false];
        yield 'old tab param is ignored' => [new Request(['tab' => 'register']), null, null, false];
        yield 'posted register data' => [new Request(), new DataBag(['email' => 'a@b.c']), null, true];
        yield 'violations' => [new Request(), null, self::violations(1), true];
        yield 'no violations' => [new Request(), null, self::violations(0), false];
        yield 'violations from request attribute' => [
            new Request(attributes: ['formViolations' => self::violations(2)]),
            null,
            null,
            true,
        ];
    }

    private static function violations(int $count): object
    {
        return new class($count) {
            public function __construct(private readonly int $count)
            {
            }

            /**
             * @return list<int>
             */
            public function getViolations(): array
            {
                return $this->count === 0 ? [] : range(1, $this->count);
            }
        };
    }

    private function createComponent(Request $request): LoginRegister
    {
        $stack = new RequestStack();
        $stack->push($request);

        return new LoginRegister($stack);
    }
}
