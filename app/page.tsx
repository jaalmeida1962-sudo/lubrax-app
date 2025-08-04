"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Car, Users, FileText, Phone, Calendar, Gauge } from "lucide-react"
import Image from "next/image"

interface Cliente {
  id: string
  posto: string
  data: string
  nome: string
  fone: string
  modeloVeiculo: string
  placaVeiculo: string
  ano: string
  dataUltimaTroca: string
  kmUltimaTroca: number
  kmProximaTroca: number
  kmAtual: number
  previsaoProximaTroca: string
  observacoes?: string
  status?: "verde" | "amarelo" | "vermelho"
}

export default function LubraxApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({ usuario: "", senha: "" })
  const [loginError, setLoginError] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesContato, setClientesContato] = useState<Cliente[]>([])
  const [formData, setFormData] = useState({
    posto: "",
    data: new Date().toISOString().split("T")[0],
    nome: "",
    fone: "",
    modeloVeiculo: "",
    placaVeiculo: "",
    ano: "",
    dataUltimaTroca: "",
    kmUltimaTroca: "",
    kmProximaTroca: "",
    kmAtual: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("cadastro")

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedClientes = localStorage.getItem("lubrax-clientes")
      if (savedClientes) {
        const parsedClientes = JSON.parse(savedClientes)
        setClientes(Array.isArray(parsedClientes) ? parsedClientes : [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setClientes([])
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      localStorage.setItem("lubrax-clientes", JSON.stringify(clientes))
      updateClientesContato()
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
    }
  }, [clientes])

  // Verificar se já está logado
  useEffect(() => {
    const loggedIn = localStorage.getItem("lubrax-logged-in")
    if (loggedIn === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  // Função de login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Credenciais padrão (você pode alterar)
    const USUARIO_CORRETO = "admin"
    const SENHA_CORRETA = "lubrax2025"

    if (loginData.usuario === USUARIO_CORRETO && loginData.senha === SENHA_CORRETA) {
      setIsAuthenticated(true)
      localStorage.setItem("lubrax-logged-in", "true")
      setLoginError("")
    } else {
      setLoginError("Usuário ou senha incorretos")
    }
  }

  // Função de logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("lubrax-logged-in")
    setLoginData({ usuario: "", senha: "" })
  }

  // Atualizar lista de contatos
  const updateClientesContato = () => {
    const hoje = new Date()
    const clientesParaContato = clientes.filter((cliente) => {
      const previsao = new Date(cliente.previsaoProximaTroca)
      const ultimaTroca = new Date(cliente.dataUltimaTroca)

      // 15 dias antes da previsão
      const dataLimite = new Date(previsao)
      dataLimite.setDate(dataLimite.getDate() - 15)

      // Mais de 1 ano desde a última troca
      const umAnoAtras = new Date(hoje)
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1)

      return hoje >= dataLimite || ultimaTroca <= umAnoAtras
    })

    setClientesContato(clientesParaContato)
  }

  // Validar placa
  const validarPlaca = (placa: string): boolean => {
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, "").toUpperCase()
    if (placaLimpa.length !== 7) return false

    // Formato antigo: 3 letras + 4 números (ex: ABC1234)
    const formatoAntigo = /^[A-Z]{3}[0-9]{4}$/
    // Formato Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23)
    const formatoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

    return formatoAntigo.test(placaLimpa) || formatoMercosul.test(placaLimpa)
  }

  // Validar telefone
  const validarTelefone = (telefone: string): boolean => {
    const telefoneNumeros = telefone.replace(/\D/g, "")
    return telefoneNumeros.length === 11 // DDD + 9 dígitos
  }

  // Formatar telefone
  const formatarTelefone = (telefone: string): string => {
    const numeros = telefone.replace(/\D/g, "")
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
    }
    return telefone
  }

  // Calcular previsão da próxima troca
  const calcularPrevisaoTroca = (dataUltima: string, kmUltima: number, kmProxima: number, kmAtual: number): string => {
    const dataUltimaTroca = new Date(dataUltima)
    const hoje = new Date()

    // Quantos dias desde a última troca
    const diasTrocou = Math.max(1, Math.ceil((hoje.getTime() - dataUltimaTroca.getTime()) / (1000 * 60 * 60 * 24)))

    // Km a percorrer até a próxima troca
    const kmAPercorrer = kmProxima - kmAtual

    // Km percorridos desde a última troca
    const kmPercorridos = Math.max(1, kmAtual - kmUltima)

    // Média diária (mínimo 1 km/dia para evitar divisão por zero)
    const mediaDiaria = Math.max(1, kmPercorridos / diasTrocou)

    // Dias para próxima troca
    const diasProxTroca = Math.max(1, Math.ceil(kmAPercorrer / mediaDiaria))

    // Data prevista
    const dataPrevisao = new Date(hoje)
    dataPrevisao.setDate(dataPrevisao.getDate() + diasProxTroca)

    return dataPrevisao.toISOString().split("T")[0]
  }

  // Validar formulário
  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (!formData.fone.trim()) newErrors.fone = "Telefone é obrigatório"
    else if (!validarTelefone(formData.fone)) newErrors.fone = "Telefone inválido"

    if (!formData.placaVeiculo.trim()) newErrors.placaVeiculo = "Placa é obrigatória"
    else if (!validarPlaca(formData.placaVeiculo)) newErrors.placaVeiculo = "Placa inválida"

    if (!formData.dataUltimaTroca) newErrors.dataUltimaTroca = "Data da última troca é obrigatória"
    else if (new Date(formData.dataUltimaTroca) > new Date()) {
      newErrors.dataUltimaTroca = "Data não pode ser futura"
    }

    if (!formData.kmUltimaTroca) newErrors.kmUltimaTroca = "KM da última troca é obrigatório"
    if (!formData.kmProximaTroca) newErrors.kmProximaTroca = "KM da próxima troca é obrigatório"
    if (!formData.kmAtual) newErrors.kmAtual = "KM atual é obrigatório"

    const kmUltima = Number.parseInt(formData.kmUltimaTroca)
    const kmProxima = Number.parseInt(formData.kmProximaTroca)
    const kmAtual = Number.parseInt(formData.kmAtual)

    if (kmAtual < kmUltima) {
      newErrors.kmAtual = "KM atual não pode ser menor que KM da última troca"
    }

    if (kmProxima <= kmAtual) {
      newErrors.kmProximaTroca = "KM da próxima troca deve ser maior que KM atual"
    }

    // Verificar se placa já existe (apenas para novos cadastros)
    if (!editingId) {
      const placaLimpa = formData.placaVeiculo.replace(/[^A-Z0-9]/g, "").toUpperCase()
      const clienteExistente = clientes.find(
        (c) => c.placaVeiculo.replace(/[^A-Z0-9]/g, "").toUpperCase() === placaLimpa,
      )

      if (clienteExistente) {
        newErrors.placaVeiculo = `Cliente já cadastrado. Previsão: ${clienteExistente.previsaoProximaTroca}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submeter formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) return

    const kmUltima = Number.parseInt(formData.kmUltimaTroca)
    const kmProxima = Number.parseInt(formData.kmProximaTroca)
    const kmAtual = Number.parseInt(formData.kmAtual)

    const previsaoProximaTroca = calcularPrevisaoTroca(formData.dataUltimaTroca, kmUltima, kmProxima, kmAtual)

    const novoCliente: Cliente = {
      id: editingId || Date.now().toString(),
      posto: formData.posto,
      data: formData.data,
      nome: formData.nome,
      fone: formatarTelefone(formData.fone),
      modeloVeiculo: formData.modeloVeiculo,
      placaVeiculo: formData.placaVeiculo.replace(/[^A-Z0-9]/g, "").toUpperCase(),
      ano: formData.ano,
      dataUltimaTroca: formData.dataUltimaTroca,
      kmUltimaTroca: kmUltima,
      kmProximaTroca: kmProxima,
      kmAtual: kmAtual,
      previsaoProximaTroca,
    }

    if (editingId) {
      setClientes((prev) => prev.map((c) => (c.id === editingId ? novoCliente : c)))
      setEditingId(null)
    } else {
      setClientes((prev) => [...prev, novoCliente])
    }

    // Limpar formulário SEMPRE após salvar
    setFormData({
      posto: "",
      data: new Date().toISOString().split("T")[0],
      nome: "",
      fone: "",
      modeloVeiculo: "",
      placaVeiculo: "",
      ano: "",
      dataUltimaTroca: "",
      kmUltimaTroca: "",
      kmProximaTroca: "",
      kmAtual: "",
    })
    setErrors({})
  }

  // Editar cliente
  const editarCliente = (cliente: Cliente) => {
    setFormData({
      posto: cliente.posto,
      data: cliente.data,
      nome: cliente.nome,
      fone: cliente.fone.replace(/\D/g, ""),
      modeloVeiculo: cliente.modeloVeiculo,
      placaVeiculo: cliente.placaVeiculo,
      ano: cliente.ano,
      dataUltimaTroca: cliente.dataUltimaTroca,
      kmUltimaTroca: cliente.kmUltimaTroca.toString(),
      kmProximaTroca: cliente.kmProximaTroca.toString(),
      kmAtual: cliente.kmAtual.toString(),
    })
    setEditingId(cliente.id)
    setActiveTab("cadastro") // Mudar para aba de cadastro
  }

  // Excluir cliente
  const excluirCliente = (id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id))
  }

  // Atualizar observações e status do contato
  const atualizarContato = (id: string, observacoes: string, status: "verde" | "amarelo" | "vermelho") => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, observacoes, status } : c)))
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verde":
        return "bg-green-500"
      case "amarelo":
        return "bg-yellow-500"
      case "vermelho":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case "verde":
        return "Vai trocar o óleo"
      case "amarelo":
        return "Ligar outro dia"
      case "vermelho":
        return "Não vai trocar o óleo"
      default:
        return "Sem status"
    }
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader className="bg-green-600 text-white text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo-lubrax.png" alt="Lubrax+" width={150} height={60} />
            </div>
            <CardTitle>Sistema de Prospecção</CardTitle>
            <CardDescription className="text-green-100">Faça login para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  type="text"
                  value={loginData.usuario}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, usuario: e.target.value }))}
                  className={loginError ? "border-red-500" : ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={loginData.senha}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, senha: e.target.value }))}
                  className={loginError ? "border-red-500" : ""}
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Entrar
              </Button>
            </form>
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              <p>
                <strong>Credenciais padrão:</strong>
              </p>
              <p>Usuário: admin</p>
              <p>Senha: lubrax2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se autenticado, mostrar o aplicativo normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto p-4">
        {/* Header com botão de logout */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Image src="/logo-lubrax.png" alt="Lubrax+" width={200} height={80} className="mr-4" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-green-700">Sistema de Prospecção</h1>
              <p className="text-yellow-600">Rede de Postos - Troca de Óleo</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
          >
            Sair
          </Button>
        </div>

        {/* Resto do aplicativo permanece igual */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-green-100">
            <TabsTrigger value="cadastro" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Car className="w-4 h-4 mr-2" />
              Cadastro
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="contatos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Contatos ({clientesContato.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba Cadastro */}
          <TabsContent value="cadastro">
            <Card className="border-green-200">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle>{editingId ? "Editar Cliente" : "Cadastro de Cliente"}</CardTitle>
                <CardDescription className="text-green-100">
                  Preencha os dados do cliente para prospecção de troca de óleo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="posto">Posto</Label>
                      <Input
                        id="posto"
                        placeholder="Nome do posto"
                        value={formData.posto}
                        onChange={(e) => setFormData((prev) => ({ ...prev, posto: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                        className={errors.nome ? "border-red-500" : ""}
                      />
                      {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
                    </div>

                    <div>
                      <Label htmlFor="fone">Telefone * (DDD + Número)</Label>
                      <Input
                        id="fone"
                        placeholder="11999999999"
                        value={formData.fone}
                        onChange={(e) => {
                          const numeros = e.target.value.replace(/\D/g, "")
                          setFormData((prev) => ({ ...prev, fone: numeros }))
                        }}
                        className={errors.fone ? "border-red-500" : ""}
                      />
                      {errors.fone && <p className="text-red-500 text-sm mt-1">{errors.fone}</p>}
                    </div>

                    <div>
                      <Label htmlFor="modeloVeiculo">Modelo do Veículo</Label>
                      <Input
                        id="modeloVeiculo"
                        value={formData.modeloVeiculo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, modeloVeiculo: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="placaVeiculo">Placa do Veículo *</Label>
                      <Input
                        id="placaVeiculo"
                        placeholder="ABC1234 ou ABC1D23"
                        value={formData.placaVeiculo}
                        onChange={(e) => {
                          // Permitir apenas letras e números, converter para maiúsculo
                          const placa = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                          if (placa.length <= 7) {
                            // Limitar a 7 caracteres
                            setFormData((prev) => ({ ...prev, placaVeiculo: placa }))
                          }
                        }}
                        className={errors.placaVeiculo ? "border-red-500" : ""}
                        maxLength={7}
                      />
                      {errors.placaVeiculo && <p className="text-red-500 text-sm mt-1">{errors.placaVeiculo}</p>}
                    </div>

                    <div>
                      <Label htmlFor="ano">Ano</Label>
                      <Input
                        id="ano"
                        type="number"
                        min="1990"
                        max="2025"
                        value={formData.ano}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ano: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dataUltimaTroca">Data Última Troca *</Label>
                      <Input
                        id="dataUltimaTroca"
                        type="date"
                        value={formData.dataUltimaTroca}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataUltimaTroca: e.target.value }))}
                        className={errors.dataUltimaTroca ? "border-red-500" : ""}
                      />
                      {errors.dataUltimaTroca && <p className="text-red-500 text-sm mt-1">{errors.dataUltimaTroca}</p>}
                    </div>

                    <div>
                      <Label htmlFor="kmUltimaTroca">KM Última Troca *</Label>
                      <Input
                        id="kmUltimaTroca"
                        type="number"
                        min="0"
                        value={formData.kmUltimaTroca}
                        onChange={(e) => setFormData((prev) => ({ ...prev, kmUltimaTroca: e.target.value }))}
                        className={errors.kmUltimaTroca ? "border-red-500" : ""}
                      />
                      {errors.kmUltimaTroca && <p className="text-red-500 text-sm mt-1">{errors.kmUltimaTroca}</p>}
                    </div>

                    <div>
                      <Label htmlFor="kmProximaTroca">KM Próxima Troca *</Label>
                      <Input
                        id="kmProximaTroca"
                        type="number"
                        min="0"
                        value={formData.kmProximaTroca}
                        onChange={(e) => setFormData((prev) => ({ ...prev, kmProximaTroca: e.target.value }))}
                        className={errors.kmProximaTroca ? "border-red-500" : ""}
                      />
                      {errors.kmProximaTroca && <p className="text-red-500 text-sm mt-1">{errors.kmProximaTroca}</p>}
                    </div>

                    <div>
                      <Label htmlFor="kmAtual">KM Atual *</Label>
                      <Input
                        id="kmAtual"
                        type="number"
                        min="0"
                        value={formData.kmAtual}
                        onChange={(e) => setFormData((prev) => ({ ...prev, kmAtual: e.target.value }))}
                        className={errors.kmAtual ? "border-red-500" : ""}
                      />
                      {errors.kmAtual && <p className="text-red-500 text-sm mt-1">{errors.kmAtual}</p>}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      {editingId ? "Atualizar" : "Cadastrar"}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setFormData({
                            posto: "",
                            data: new Date().toISOString().split("T")[0],
                            nome: "",
                            fone: "",
                            modeloVeiculo: "",
                            placaVeiculo: "",
                            ano: "",
                            dataUltimaTroca: "",
                            kmUltimaTroca: "",
                            kmProximaTroca: "",
                            kmAtual: "",
                          })
                          setErrors({})
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Relatórios */}
          <TabsContent value="relatorios">
            <Card className="border-green-200">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle>Relatório de Clientes</CardTitle>
                <CardDescription className="text-green-100">Todos os clientes cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {clientes.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Última Troca</TableHead>
                          <TableHead>KM Atual</TableHead>
                          <TableHead>Previsão</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes.map((cliente) => (
                          <TableRow key={cliente.id}>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell>{cliente.fone}</TableCell>
                            <TableCell>{cliente.placaVeiculo}</TableCell>
                            <TableCell>{cliente.modeloVeiculo}</TableCell>
                            <TableCell>{new Date(cliente.dataUltimaTroca).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{cliente.kmAtual.toLocaleString()}</TableCell>
                            <TableCell>{new Date(cliente.previsaoProximaTroca).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => editarCliente(cliente)}>
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => excluirCliente(cliente.id)}>
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Contatos */}
          <TabsContent value="contatos">
            <Card className="border-green-200">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle>Contatos para Troca de Óleo</CardTitle>
                <CardDescription className="text-green-100">
                  Clientes próximos ao vencimento da troca de óleo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Legenda */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Legenda:</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Vai trocar o óleo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span>Ligar outro dia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Não vai trocar o óleo</span>
                    </div>
                  </div>
                </div>

                {clientesContato.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum cliente para contato no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientesContato.map((cliente) => (
                      <Card key={cliente.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <Phone className="w-4 h-4 inline mr-1" />
                                  {cliente.fone}
                                </p>
                                <p>
                                  <Car className="w-4 h-4 inline mr-1" />
                                  {cliente.placaVeiculo} - {cliente.modeloVeiculo}
                                </p>
                                <p>
                                  <Calendar className="w-4 h-4 inline mr-1" />
                                  Previsão: {new Date(cliente.previsaoProximaTroca).toLocaleDateString("pt-BR")}
                                </p>
                                <p>
                                  <Gauge className="w-4 h-4 inline mr-1" />
                                  KM Atual: {cliente.kmAtual.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getStatusColor(cliente.status)} text-white`}>
                                  {getStatusText(cliente.status)}
                                </Badge>
                              </div>
                              <Textarea
                                placeholder="Observações do contato..."
                                value={cliente.observacoes || ""}
                                onChange={(e) => {
                                  const newClientes = clientes.map((c) =>
                                    c.id === cliente.id ? { ...c, observacoes: e.target.value } : c,
                                  )
                                  setClientes(newClientes)
                                }}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => atualizarContato(cliente.id, cliente.observacoes || "", "verde")}
                                >
                                  Vai trocar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600"
                                  onClick={() => atualizarContato(cliente.id, cliente.observacoes || "", "amarelo")}
                                >
                                  Ligar depois
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => atualizarContato(cliente.id, cliente.observacoes || "", "vermelho")}
                                >
                                  Não vai trocar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
