import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  company_id: string;
  role: string;
  department?: string;
  position?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create client with user's token to verify permissions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      console.log("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin or super_admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      console.log("User is not admin:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: "Permissão negada. Apenas administradores podem criar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    console.log("Creating user:", body.email);

    // Validate required fields
    if (!body.email || !body.password || !body.full_name || !body.company_id || !body.role) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, password, full_name, company_id, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with Supabase Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: body.full_name,
        must_change_password: true,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      let errorMessage = "Erro ao criar usuário";
      if (createError.message.includes("already been registered")) {
        errorMessage = "Este email já está cadastrado no sistema";
      } else if (createError.message.includes("invalid")) {
        errorMessage = "Email inválido";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Falha ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", newUser.user.id);

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email: body.email,
        full_name: body.full_name,
        company_id: body.company_id,
        department: body.department || null,
        position: body.position || null,
        is_active: true,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Try to delete the created user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil do usuário", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: body.role,
      });

    if (roleError) {
      console.error("Error setting role:", roleError);
    }

    // Add user to company
    const { error: companyError } = await supabaseAdmin
      .from("user_companies")
      .insert({
        user_id: newUser.user.id,
        company_id: body.company_id,
        is_primary: true,
      });

    if (companyError) {
      console.error("Error adding to company:", companyError);
    }

    console.log("User setup complete:", newUser.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
        message: "Usuário criado com sucesso. A senha temporária foi definida."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});