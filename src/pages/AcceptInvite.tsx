import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  company_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  company_name: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de convite inválido");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_invitation_by_token", { _token: token });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError("Convite não encontrado ou expirado");
        return;
      }

      setInvitation(data[0] as InvitationData);
      setSignupEmail(data[0].email);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !token) return;

    setAccepting(true);
    try {
      const { data, error } = await supabase
        .rpc("accept_invitation", { _token: token, _user_id: user.id });

      if (error) throw error;

      if (data) {
        toast.success("Convite aceito com sucesso!");
        navigate("/dashboard");
      } else {
        throw new Error("Erro ao aceitar convite");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/accept-invite?token=${token}`,
          data: {
            full_name: signupName,
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada! Você pode aceitar o convite agora.");
      // The auth state will update and show the accept button
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setSigningUp(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    validator: "Validador",
    responsible: "Responsável",
    reader: "Leitor",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/login")}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Convite para {invitation.company_name}</CardTitle>
          <CardDescription>
            Você foi convidado para participar como{" "}
            <strong>{roleLabels[invitation.role] || invitation.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Logado como:</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {user.email !== invitation.email && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
                  <p className="text-sm text-warning">
                    Atenção: Este convite foi enviado para {invitation.email}.
                    Você está logado com um email diferente.
                  </p>
                </div>
              )}
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full"
                size="lg"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aceitar Convite
                  </>
                )}
              </Button>
            </div>
          ) : showSignup ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={signingUp} className="w-full">
                {signingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta e Aceitar"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowSignup(false)}
                className="w-full"
              >
                Já tenho conta
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Para aceitar este convite, faça login ou crie uma conta.
              </p>
              <Button
                onClick={() => navigate(`/login?redirect=/accept-invite?token=${token}`)}
                className="w-full"
              >
                Fazer Login
              </Button>
              <Button
                onClick={() => setShowSignup(true)}
                variant="outline"
                className="w-full"
              >
                Criar Nova Conta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
